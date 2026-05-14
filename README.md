# KAWSAYMI CARE — Backend

API REST para gestión de medicamentos, adherencia y cuidado personal.
Construida con **NestJS 11 + Prisma 7 + Supabase PostgreSQL + pgvector**.

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
| pdfjs-dist | 4.x | Extracción de texto de PDFs |
| VoyageAI | — | Embeddings vectoriales (voyage-3-lite) |
| pgvector | — | Búsqueda semántica en PostgreSQL |
| Groq | — | Respuestas RAG vía LLM |

---

## Requisitos

- Node.js 20+
- Cuenta en [Supabase](https://supabase.com)
- API key de [VoyageAI](https://www.voyageai.com) (embedding)
- (Opcional) API key de [Groq](https://groq.com) para respuestas RAG

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

# Vector DB (pgvector) — puede ser el mismo Supabase o uno separado
VECTOR_DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# VoyageAI (embedding)
VOYAGE_API_KEY=tu-voyage-api-key
# (Opcional) Override del modelo y dimensión
# VOYAGE_EMBED_MODEL=voyage-3-lite
# EMBEDDING_DIMS=512

# (Opcional) Groq para respuestas RAG
GROQ_API_KEY=...
# GROQ_MODEL=llama-3.1-8b-instant
# GROQ_BASE_URL=https://api.groq.com/openai/v1
```

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

## Migraciones Prisma

```bash
npx prisma migrate dev --name <nombre>
```

---

## Supabase — migraciones vectoriales

El módulo RAG requiere migraciones SQL directamente en Supabase. Están en `supabase/migrations/` y deben ejecutarse en orden:

| Archivo | Propósito |
|---|---|
| `20260418121000_knowledge_vectors.sql` | Schema inicial pgvector (dim 384) |
| `20260419120000_knowledge_vectors_voyage_512.sql` | Migración a dim 512 (VoyageAI) |
| `20260501120000_fix_vector_search.sql` | Fix búsqueda vectorial |
| `20260501120500_add_chunk_metadata.sql` | Metadatos en chunks |
| `20260501121000_add_metadata_to_rpc.sql` | Metadatos en RPC |

---

## Documentación API

Con el servidor corriendo, abrir:

```
http://localhost:3000/api/docs
```

Swagger interactivo con todos los endpoints, ejemplos de body y autenticación Bearer.

Para documentación detallada desde el frontend (con ejemplos de requests y responses), ver [`FRONTEND_API.md`](./FRONTEND_API.md).

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
| PUT | `/health/profile` | Actualizar perfil de salud (peso/altura) — recalcula IMC |
| POST | `/health/weight` | Registrar peso en kg — recalcula IMC automáticamente |
| POST | `/health/height` | Registrar altura en cm — recalcula IMC automáticamente |
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

### Knowledge (RAG)
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/knowledge/documents` | Ingestar PDFs desde `./pdfs_descargados` (requiere ADMIN) |
| GET | `/knowledge/search?q=...&k=10` | Búsqueda semántica sobre documentos ingestados |
| POST | `/knowledge/answer` | Pregunta RAG con contexto + respuesta LLM (requiere auth) |

---

## Knowledge Base (RAG)

### Cómo funciona

1. Los PDFs se colocan en `./pdfs_descargados/`.
2. `POST /knowledge/documents` lee los PDFs, los chunkea, genera embeddings vía VoyageAI y los guarda en pgvector.
3. `GET /knowledge/search` busca chunks semánticamente similares usando similitud coseno.
4. `POST /knowledge/answer` arma contexto con los chunks relevantes y envía a Groq para generar respuesta con citas.

### Embeddings

- **Provider:** VoyageAI
- **Modelo default:** `voyage-3-lite` (512 dims)
- Se normaliza L2 para usar similitud coseno
- Se puede configurar vía `VOYAGE_EMBED_MODEL` y `EMBEDDING_DIMS`

### Ejemplo: RAG con Groq

```bash
curl -X POST "http://localhost:3000/knowledge/answer" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"q":"¿Qué recomienda la guía sobre dengue en adultos?","k":6}'
```

Devuelve:
- `answer`: respuesta del modelo (instruido a citar fuentes [S1], [S2], ...)
- `sources`: metadata compacta por fuente
- `matches`: chunks usados (solo si `debug=true`)

### Roles / Admin

- Prisma tiene `Role.ADMIN`.
- El endpoint de ingesta (`POST /knowledge/documents`) requiere `Role=ADMIN`.
- Para crear un admin en dev: registrar un usuario normal y promoverlo en la DB (`Role` a `ADMIN`).

### Troubleshooting

- **`Vector DB schema missing`** o error `42P01`: no se ejecutaron las migraciones SQL de `supabase/migrations/` en la DB que apunta `VECTOR_DATABASE_URL`.
- **Error `Tenant or user not found`**: `VECTOR_DATABASE_URL` mal armada para el pooler (usuario suele ser `postgres.<project-ref>`).
- **Error `Embedding dims mismatch`**: los vectores en DB tienen dimensión distinta a la del modelo configurado. Re-ingestar con `do-reingest.js` después de migrar.

---

## Estructura de carpetas

```
src/
├── adherence/
│   ├── adherence.controller.ts
│   ├── adherence.module.ts
│   └── adherence.service.ts
├── auth/
│   ├── decorators/
│   │   ├── get-user.decorator.ts
│   │   └── roles.decorator.ts
│   ├── dto/
│   │   ├── login.dto.ts
│   │   ├── refresh.dto.ts
│   │   └── register.dto.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── caregivers/
│   ├── dto/
│   │   ├── invite-caregiver.dto.ts
│   │   └── update-permissions.dto.ts
│   ├── caregivers.controller.ts
│   ├── caregivers.module.ts
│   └── caregivers.service.ts
├── events/
│   ├── dto/
│   │   └── events-range-query.dto.ts
│   ├── events.controller.ts
│   ├── events.module.ts
│   └── events.service.ts
├── health/
│   ├── dto/
│   │   ├── update-health-profile.dto.ts
│   │   ├── update-height.dto.ts
│   │   └── update-weight.dto.ts
│   ├── health.controller.ts
│   ├── health.module.ts
│   └── health.service.ts
├── knowledge/
│   ├── dto/
│   │   ├── answer.dto.ts
│   │   └── suggestion.dto.ts
│   ├── services/
│   │   ├── chunking.service.ts
│   │   ├── embeddings.service.ts
│   │   ├── groq.service.ts
│   │   ├── ingest.service.ts
│   │   ├── pdf-text.service.ts
│   │   └── vector-db.service.ts
│   ├── knowledge.controller.ts
│   └── knowledge.module.ts
├── medications/
│   ├── dto/
│   │   ├── create-medication.dto.ts
│   │   ├── update-medication-status.dto.ts
│   │   └── update-medication.dto.ts
│   ├── medications.controller.ts
│   ├── medications.module.ts
│   └── medications.service.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── scheduler/
│   ├── scheduler.module.ts
│   └── scheduler.service.ts
├── users/
│   ├── dto/
│   │   ├── update-allergies.dto.ts
│   │   ├── update-conditions.dto.ts
│   │   ├── update-me.dto.ts
│   │   └── update-medical-background.dto.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
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

Asegurarse de configurar todas las variables de entorno en la plataforma elegida antes de deployar.
