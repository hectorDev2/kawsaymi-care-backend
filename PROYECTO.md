# KAWSAYMI CARE — Estado del Backend

## Stack

- **Framework:** NestJS 11 + TypeScript 5.7
- **DB:** Supabase PostgreSQL (session mode pooler — port 5432)
- **ORM:** Prisma 7 + `@prisma/adapter-pg`
- **Auth:** Supabase Auth + JWT (`passport-jwt`)
- **Validación:** class-validator + class-transformer

---

## Variables de entorno requeridas

```env
DATABASE_URL=postgresql://...pooler.supabase.com:5432/postgres   # session mode, sin pgbouncer
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
```

---

## Base de Datos — Schema

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
│
├── → Medication[] (1:N)
├── → MedicationEvent[] (1:N)
├── → HealthData (1:1)
├── → CaregiverRelation[] como paciente (1:N)
└── → CaregiverRelation[] como cuidador (1:N)

Medication
├── id, userId (FK→User)
├── name, dose, frequency, intervalHours
├── instructions?, startDate, endDate?
├── status (ACTIVE | COMPLETED | SUSPENDED)
├── schedule String[]
└── → MedicationEvent[] (1:N)

MedicationEvent
├── id, medicationId (FK), userId (FK)
├── dateTimeScheduled
└── status (PENDING | TAKEN | MISSED)

HealthData
├── id, userId (FK, unique)
├── weight?, height?, imc?
├── sleepHours?, exerciseMinutes?, waterLiters?

CaregiverRelation
├── patientId (FK), caregiverId (FK)
├── permissions String[]
└── @@unique([patientId, caregiverId])
```

---

## Features — Estado

### Semana 1 — Setup + Auth ✅ COMPLETA

| Feature | Estado | Endpoints |
|---|---|---|
| Proyecto NestJS + Prisma + Supabase | ✅ | — |
| Migrations aplicadas | ✅ | — |
| PrismaModule global | ✅ | — |
| ValidationPipe global | ✅ | — |
| Auth Module | ✅ | `POST /auth/register` `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` |
| JwtAuthGuard + @GetUser() | ✅ | — |

### Semana 2 — Users + Medications ⬜ PENDIENTE

| Feature | Estado | Endpoints |
|---|---|---|
| Users Module | ⬜ | `GET /users/me` `PUT /users/me` `PUT /users/me/allergies` `PUT /users/me/conditions` `DELETE /users/me` |
| Medications Module | ⬜ | `GET /medications` `GET /medications/:id` `POST /medications` `PUT /medications/:id` `PATCH /medications/:id/status` `DELETE /medications/:id` |

### Semana 3 — Events + Adherence + Health ⬜ PENDIENTE

| Feature | Estado | Endpoints |
|---|---|---|
| Events Module | ⬜ | `GET /events` `GET /events/today` `GET /events/week` `PATCH /events/:id/mark-taken` `PATCH /events/:id/mark-missed` |
| Adherence Module | ⬜ | `GET /adherence/today` `GET /adherence/week` `GET /adherence/month` `GET /adherence/stats` |
| Health Module | ⬜ | `GET /health/profile` `POST /health/weight` `GET /health/imc` `GET /health/polypharmacy` |

### Semana 4 — Caregivers + Scheduler + Polish ⬜ PENDIENTE

| Feature | Estado | Endpoints |
|---|---|---|
| Caregivers Module | ⬜ | `POST /caregivers/invite` `GET /caregivers/my-patients` `GET /caregivers/my-caregivers` `PATCH /caregivers/:id/permissions` `DELETE /caregivers/:id` |
| Scheduler Module | ⬜ | Cron jobs internos |
| Swagger / OpenAPI | ⬜ | `GET /api/docs` |
| Testing E2E | ⬜ | — |

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
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── users/               ← Semana 2
├── medications/         ← Semana 2
├── events/              ← Semana 3
├── adherence/           ← Semana 3
├── health/              ← Semana 3
├── caregivers/          ← Semana 4
├── scheduler/           ← Semana 4
├── app.module.ts
└── main.ts
```

---

## Gotchas — Prisma 7 + Supabase

- Prisma 7 **requiere** `@prisma/adapter-pg` — sin adapter no arranca (`PrismaClientInitializationError`)
- La URL va en `prisma.config.ts`, NO en `schema.prisma` (breaking change v7)
- `datasourceUrl` fue eliminado del constructor de `PrismaClient` en v7
- `migrations.datasource` NO existe en `defineConfig` — solo hay `datasource.url`
- Usar **session mode** (port `5432`, sin `?pgbouncer=true`) para todo
- Transaction mode (`6543`, `pgbouncer=true`) falla en migrations: `prepared statement "s1" already exists`
- Direct URL (`db.PROJECT.supabase.co:5432`) falla en redes sin IPv6
- Supabase Auth: deshabilitar **Email Confirmations** en Authentication → Settings para desarrollo
