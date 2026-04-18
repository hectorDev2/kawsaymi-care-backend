# KAWSAYMI CARE — Backend

API REST para gestión de medicamentos, adherencia y cuidado personal.
Construida con **NestJS 11 + Prisma 7 + Supabase PostgreSQL**.

---

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| NestJS | 11 | Framework principal |
| TypeScript | 5.7 | Lenguaje |
| Prisma | 7 | ORM |
| @prisma/adapter-pg | — | Adaptador PostgreSQL (requerido en Prisma 7) |
| Supabase | — | PostgreSQL + Auth |
| @supabase/supabase-js | — | Cliente Auth |
| passport-jwt + jwks-rsa | — | Validación de tokens Supabase |
| luxon | — | Manejo de fechas y timezones |
| @nestjs/schedule | — | Cron jobs |
| @nestjs/swagger | — | Documentación API |
| class-validator | — | Validación de DTOs |

---

## Requisitos

- Node.js 20+
- Cuenta en [Supabase](https://supabase.com)

---

## Instalación

```bash
npm install
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz con:

```env
# Supabase — session mode pooler (port 5432, sin pgbouncer)
# Usar ESTA URL para todo — migrations y runtime
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Supabase API
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_JWT_SECRET=tu-jwt-secret

# Vector DB (pgvector) - idealmente un Supabase separado
VECTOR_DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# (Opcional) Groq para RAG answers
GROQ_API_KEY=...
```

## Estado actual (2026-04-18)

Hoy el backend ya tiene un primer MVP de **Knowledge Base (RAG)** funcionando:

- Ingesta de PDFs desde `./pdfs_descargados` hacia una **DB vectorial** en Supabase (pgvector).
- Embeddings locales con `@huggingface/transformers` usando `intfloat/multilingual-e5-small` (384 dims).
- Búsqueda semántica por RPC (`match_document_chunks`).
- Seguridad: endpoint de ingesta restringido a `Role=ADMIN`.

Pendiente principal:

- Acordar qué archivos/versionar (por ejemplo, no commitear `pdfs_descargados/`) y cerrar el diff con un commit.

## Knowledge (pgvector)

**Qué hace**

- Los PDFs se leen desde `./pdfs_descargados`.
- Ingesta: `POST /knowledge/documents` (requiere `Role=ADMIN`).
- Búsqueda: `GET /knowledge/search?q=...&k=10`.

**DB vectorial**

- Se usa una conexión separada (sin Prisma) vía `pg`.
- Variable: `VECTOR_DATABASE_URL` (idealmente a un Supabase separado del principal).
- Antes de ingestar, aplicá el SQL en el Supabase vectorial:
  `supabase/migrations/20260418121000_knowledge_vectors.sql`.

**Embeddings**

- Modelo: `intfloat/multilingual-e5-small`.
- Dimensión: 384.
- Regla E5:
  `query: <texto>` para búsquedas.
  `passage: <texto>` para chunks.
- Se normaliza L2 para usar similitud coseno.
- Cache local: el modelo se baja a `./.cache/transformers` (está ignorado por git).

**Roles / Admin**

- Prisma tiene `Role.ADMIN`.
- El registro por `POST /auth/register` solo permite `PATIENT` y `CAREGIVER`.
- Para crear un admin en dev:
  Registrá un usuario normal y promovelo en la DB principal (`Role` a `ADMIN`).

**Troubleshooting**

- `Vector DB schema missing` o error Postgres `42P01`:
  No se ejecutó el SQL de `supabase/migrations/20260418121000_knowledge_vectors.sql` en el Supabase vectorial que apunta `VECTOR_DATABASE_URL`.
- Error `Tenant or user not found`:
  `VECTOR_DATABASE_URL` mal armada para el pooler (usuario suele ser `postgres.<project-ref>`).
- Error `Protobuf parsing failed` al cargar el modelo:
  Cache corrupta. Borrar `./.cache/transformers` y reintentar (forzará re-descarga).
- `pdfjs-dist` warnings de fonts:
  Son frecuentes en PDFs “raros”; mientras extraiga texto, se puede ignorar.

Los valores se obtienen en **Supabase → Project Settings → API**.

> **Importante:** Deshabilitar confirmación de email en Supabase → **Authentication → Settings → Email Confirmations** para desarrollo.

---

## Correr el proyecto

```bash
# Desarrollo (watch mode)
npm run start:dev

# Producción
npm run start:prod
```

---

## Migrations

```bash
npx prisma migrate dev --name <nombre>
```

---

## Documentación API

Con el servidor corriendo, abrir:

```
http://localhost:3000/api/docs
```

Swagger interactivo con todos los endpoints, ejemplos de body y autenticación Bearer.

---

## Autenticación

Todos los endpoints excepto `/auth/register` y `/auth/login` requieren el header:

```
Authorization: Bearer <access_token>
```

El `access_token` se obtiene desde `POST /auth/login`.

---

## Endpoints

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/register` | Registrar usuario (email, password, name, role) |
| POST | `/auth/login` | Login — devuelve access_token y refresh_token |
| POST | `/auth/refresh` | Refrescar access_token con refresh_token |
| POST | `/auth/logout` | Cerrar sesión |

### Users
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/users/me` | Obtener perfil del usuario autenticado |
| PUT | `/users/me` | Actualizar nombre, ubicación, idioma, timezone |
| PUT | `/users/me/allergies` | Actualizar lista de alergias |
| PUT | `/users/me/conditions` | Actualizar condiciones médicas |
| DELETE | `/users/me` | Eliminar cuenta y todos los datos |

### Medications
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/medications` | Listar medicamentos del usuario |
| GET | `/medications/:id` | Detalle de un medicamento |
| POST | `/medications` | Crear medicamento con horarios de toma |
| PUT | `/medications/:id` | Actualizar medicamento |
| PATCH | `/medications/:id/status` | Cambiar estado: ACTIVE / SUSPENDED / COMPLETED |
| DELETE | `/medications/:id` | Eliminar medicamento y sus eventos |

### Events
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/events` | Listar eventos con filtros (from, to, medicationId, status) |
| GET | `/events/today` | Eventos de hoy — genera automáticamente si no existen |
| GET | `/events/week` | Eventos de la semana — genera automáticamente si no existen |
| PATCH | `/events/:id/mark-taken` | Marcar evento como tomado |
| PATCH | `/events/:id/mark-missed` | Marcar evento como omitido |

### Adherence
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/adherence/today` | Adherencia de hoy (taken / missed / pending / %) |
| GET | `/adherence/week` | Adherencia de la semana |
| GET | `/adherence/month` | Adherencia del mes |
| GET | `/adherence/stats` | Stats generales + medicamentos activos |

### Health
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health/profile` | Perfil de salud — crea vacío si no existe |
| POST | `/health/weight` | Registrar peso en kg — recalcula IMC automáticamente |
| GET | `/health/imc` | Obtener IMC calculado |
| GET | `/health/polypharmacy` | Detectar polifarmacia (true si 5+ medicamentos activos) |

### Caregivers
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/caregivers/invite` | Invitar cuidador por email |
| GET | `/caregivers/my-patients` | Listar pacientes (para cuidadores) |
| GET | `/caregivers/my-caregivers` | Listar cuidadores (para pacientes) |
| PATCH | `/caregivers/:id/permissions` | Actualizar permisos de la relación |
| DELETE | `/caregivers/:id` | Eliminar relación cuidador-paciente |
| GET | `/caregivers/:patientId/alerts` | Alertas del paciente — eventos omitidos últimos 7 días |

---

## Estructura de carpetas

```
src/
├── auth/
│   ├── decorators/get-user.decorator.ts
│   ├── dto/login.dto.ts
│   ├── dto/refresh.dto.ts
│   ├── dto/register.dto.ts
│   ├── guards/jwt-auth.guard.ts
│   ├── strategies/jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
├── medications/
├── events/
├── adherence/
├── health/
├── caregivers/
├── scheduler/
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.module.ts
└── main.ts
```

---

## Cron jobs (Scheduler)

| Frecuencia | Tarea |
|---|---|
| Diario 00:05 UTC | Genera eventos de medicación para los próximos 30 días |
| Cada hora | Marca como MISSED todos los eventos PENDING cuya hora ya pasó |

---

## Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## Deploy

Plataformas recomendadas: **Railway** o **Fly.io**.

Asegurarse de configurar las variables de entorno en la plataforma elegida antes de deployar.
