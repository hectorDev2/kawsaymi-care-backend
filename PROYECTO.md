# KAWSAYMI CARE — Estado del Proyecto

## Stack

| Tecnología | Uso |
|---|---|
| NestJS 11 + TypeScript 5.7 | Framework y lenguaje |
| Prisma 7 + @prisma/adapter-pg | ORM — requiere adapter obligatorio en v7 |
| Supabase PostgreSQL | Base de datos (session mode pooler — port 5432) |
| @supabase/supabase-js | Cliente Supabase Auth |
| passport-jwt + jwks-rsa | Validación de JWT via JWKS |
| luxon | Fechas y timezones |
| @nestjs/schedule | Cron jobs |
| @nestjs/swagger | Documentación interactiva |
| class-validator + class-transformer | Validación de DTOs |

---

## Variables de entorno

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
```

---

## Base de datos — Schema

```
User
├── id (cuid, PK)
├── email (unique)
├── role (PATIENT | CAREGIVER)
├── name
├── dateOfBirth?
├── location?
├── language (default: "es")
├── timezone (default: "UTC")
├── allergies String[]
├── conditions String[]
├── createdAt / updatedAt
├── → Medication[] (1:N)
├── → MedicationEvent[] (1:N)
├── → HealthData (1:1)
├── → CaregiverRelation[] como paciente (1:N)
└── → CaregiverRelation[] como cuidador (1:N)

Medication
├── id, userId (FK→User)
├── name, dose
├── frequency (veces por día), intervalHours (horas entre dosis)
├── instructions?
├── startDate, endDate?
├── status (ACTIVE | COMPLETED | SUSPENDED)
├── schedule String[]   ← lista de ISO datetimes con los horarios de toma
└── → MedicationEvent[] (1:N)

MedicationEvent
├── id, medicationId (FK), userId (FK)
├── dateTimeScheduled
└── status (PENDING | TAKEN | MISSED)

HealthData
├── id, userId (FK, unique)
├── weight? (kg), height? (m), imc?
├── sleepHours?, exerciseMinutes?, waterLiters?

CaregiverRelation
├── id, patientId (FK), caregiverId (FK)
├── permissions String[]   ← ["read", "notify"]
└── @@unique([patientId, caregiverId])
```

Migration aplicada: `20260414114558_init`

---

## Features — Estado

### Semana 1 — Setup + Auth ✅ COMPLETA

| Feature | Estado | Archivos clave |
|---|---|---|
| Proyecto NestJS + Prisma + Supabase | ✅ | `prisma.config.ts`, `prisma/schema.prisma` |
| PrismaModule global con adapter-pg | ✅ | `src/prisma/` |
| ValidationPipe global (whitelist) | ✅ | `src/main.ts` |
| Auth Module completo | ✅ | `src/auth/` |
| JwtAuthGuard + @GetUser() decorator | ✅ | `src/auth/guards/`, `src/auth/decorators/` |

**Endpoints Auth:**
| Método | Ruta |
|---|---|
| POST | `/auth/register` |
| POST | `/auth/login` |
| POST | `/auth/refresh` |
| POST | `/auth/logout` |

---

### Semana 2 — Users + Medications ✅ COMPLETA

| Feature | Estado | Archivos clave |
|---|---|---|
| Users Module | ✅ | `src/users/` |
| Medications Module | ✅ | `src/medications/` |

**Endpoints Users:**
| Método | Ruta |
|---|---|
| GET | `/users/me` |
| PUT | `/users/me` |
| PUT | `/users/me/allergies` |
| PUT | `/users/me/conditions` |
| DELETE | `/users/me` |

**Endpoints Medications:**
| Método | Ruta |
|---|---|
| GET | `/medications` |
| GET | `/medications/:id` |
| POST | `/medications` |
| PUT | `/medications/:id` |
| PATCH | `/medications/:id/status` |
| DELETE | `/medications/:id` |

---

### Semana 3 — Events + Adherence + Health ✅ COMPLETA

| Feature | Estado | Archivos clave |
|---|---|---|
| Events Module | ✅ | `src/events/` |
| Adherence Module | ✅ | `src/adherence/` |
| Health Module | ✅ | `src/health/` |

**Lógica de events:** `Medication.schedule` es una lista de ISO datetimes. Al consultar `/events/today` o `/events/week`, el servicio materializa automáticamente los `MedicationEvent` faltantes en ese rango (idempotente).

**Lógica de adherencia:** `adherenceRate = taken / (taken + missed + pending)`. Se calcula por día, semana o mes respetando el timezone del usuario.

**Endpoints Events:**
| Método | Ruta |
|---|---|
| GET | `/events?from=&to=&medicationId=&status=` |
| GET | `/events/today` |
| GET | `/events/week` |
| PATCH | `/events/:id/mark-taken` |
| PATCH | `/events/:id/mark-missed` |

**Endpoints Adherence:**
| Método | Ruta |
|---|---|
| GET | `/adherence/today` |
| GET | `/adherence/week` |
| GET | `/adherence/month` |
| GET | `/adherence/stats` |

**Endpoints Health:**
| Método | Ruta |
|---|---|
| GET | `/health/profile` |
| POST | `/health/weight` |
| GET | `/health/imc` |
| GET | `/health/polypharmacy` |

---

### Semana 4 — Caregivers + Scheduler + Swagger ✅ COMPLETA

| Feature | Estado | Archivos clave |
|---|---|---|
| Caregivers Module | ✅ | `src/caregivers/` |
| Scheduler Module | ✅ | `src/scheduler/` |
| Swagger / OpenAPI | ✅ | `src/main.ts` → `GET /api/docs` |
| Decoradores Swagger en todos los módulos | ✅ | Todos los controllers y DTOs |

**Endpoints Caregivers:**
| Método | Ruta |
|---|---|
| POST | `/caregivers/invite` |
| GET | `/caregivers/my-patients` |
| GET | `/caregivers/my-caregivers` |
| PATCH | `/caregivers/:id/permissions` |
| DELETE | `/caregivers/:id` |
| GET | `/caregivers/:patientId/alerts` |

**Cron jobs (Scheduler):**
| Frecuencia | Tarea |
|---|---|
| Diario 00:05 UTC | Genera eventos para los próximos 30 días en todos los medicamentos activos |
| Cada hora | Marca como MISSED los eventos PENDING cuya hora ya pasó |

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
│   ├── strategies/jwt.strategy.ts   ← valida JWT Supabase via JWKS
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── dto/update-allergies.dto.ts
│   ├── dto/update-conditions.dto.ts
│   ├── dto/update-me.dto.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── medications/
│   ├── dto/create-medication.dto.ts
│   ├── dto/update-medication-status.dto.ts
│   ├── dto/update-medication.dto.ts
│   ├── medications.controller.ts
│   ├── medications.module.ts
│   └── medications.service.ts
├── events/
│   ├── dto/events-range-query.dto.ts
│   ├── events.controller.ts
│   ├── events.module.ts
│   └── events.service.ts            ← genera eventos on-demand e idempotente
├── adherence/
│   ├── adherence.controller.ts
│   ├── adherence.module.ts          ← importa EventsModule
│   └── adherence.service.ts
├── health/
│   ├── dto/update-weight.dto.ts
│   ├── health.controller.ts
│   ├── health.module.ts
│   └── health.service.ts
├── caregivers/
│   ├── dto/invite-caregiver.dto.ts
│   ├── dto/update-permissions.dto.ts
│   ├── caregivers.controller.ts
│   ├── caregivers.module.ts
│   └── caregivers.service.ts
├── scheduler/
│   ├── scheduler.module.ts
│   └── scheduler.service.ts         ← 2 cron jobs
├── prisma/
│   ├── prisma.module.ts             ← @Global()
│   └── prisma.service.ts            ← PrismaPg adapter
├── app.module.ts
└── main.ts                          ← ValidationPipe + Swagger
```

---

## Gotchas — Prisma 7 + Supabase

- Prisma 7 **requiere** `@prisma/adapter-pg` — sin adapter tira `PrismaClientInitializationError`
- La URL va en `prisma.config.ts`, **NO** en `schema.prisma` (breaking change v7)
- `datasourceUrl` fue eliminado del constructor de `PrismaClient` en v7
- `migrations.datasource` **NO existe** en `defineConfig` de Prisma 7
- Usar **session mode** (port `5432`, sin `?pgbouncer=true`) para todo
- Transaction mode (`6543`, `pgbouncer=true`) falla en migrations: `prepared statement "s1" already exists`
- Direct URL (`db.PROJECT.supabase.co:5432`) falla en redes sin IPv6
- Supabase Auth: deshabilitar **Email Confirmations** en Authentication → Settings para desarrollo

---

## Pendiente

- [ ] Unit tests (Jest) — cobertura mínima 80%
- [ ] E2E tests
- [ ] Deploy a Railway / Fly.io
- [ ] Notificaciones push (FCM) en el Scheduler
