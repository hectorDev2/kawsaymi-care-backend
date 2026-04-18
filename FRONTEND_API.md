# Kawsaymi Care Backend API (para Frontend)

Este documento describe como consumir los servicios disponibles (Semana 1 a Semana 3).

## Base URL

- Local: `http://localhost:3000`

## Auth

### Headers

Para rutas protegidas enviar:

```http
Authorization: Bearer <access_token>
```

El `access_token` se obtiene desde `POST /auth/login`.

### POST /auth/register

Registra un usuario en Supabase Auth y crea el registro en Postgres.

Request:

```json
{
  "email": "test1@kawsaymi.com",
  "password": "secret",
  "name": "test1",
  "role": "PATIENT"
}
```

Notas:

- `role` en registro solo acepta `PATIENT` o `CAREGIVER`.
- `ADMIN` no se puede registrar por API pública.

Response (ejemplo):

```json
{
  "user": { "id": "...", "email": "...", "role": "PATIENT", "name": "..." },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

### POST /auth/login

Request:

```json
{
  "email": "test1@kawsaymi.com",
  "password": "secret"
}
```

Response:

```json
{
  "user": { "id": "...", "email": "..." },
  "session": {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

### POST /auth/refresh

Request:

```json
{ "refreshToken": "..." }
```

Response:

```json
{ "session": { "access_token": "...", "refresh_token": "..." } }
```

### POST /auth/logout

Requiere Bearer token.

Response:

```json
{ "success": true }
```

## Users (Semana 2)

Todos requieren Bearer token.

### GET /users/me

Response:

```json
{ "user": { "id": "...", "email": "...", "name": "..." } }
```

### PUT /users/me

Body (todos opcionales):

```json
{
  "name": "Nuevo nombre",
  "dateOfBirth": "1990-01-01",
  "location": "Lima",
  "language": "es",
  "timezone": "UTC"
}
```

Response:

```json
{ "user": { "id": "..." } }
```

### PUT /users/me/allergies

Body:

```json
{ "allergies": ["penicillin"] }
```

### PUT /users/me/conditions

Body:

```json
{ "conditions": ["hypertension"] }
```

### DELETE /users/me

Response:

```json
{ "success": true }
```

## Medications (Semana 2)

Todos requieren Bearer token.

### GET /medications

Response:

```json
{ "medications": [{ "id": "...", "name": "..." }] }
```

### GET /medications/:id

Response:

```json
{ "medication": { "id": "...", "name": "..." } }
```

### POST /medications

Body:

```json
{
  "name": "Ibuprofeno",
  "dose": "400mg",
  "frequency": 2,
  "intervalHours": 12,
  "instructions": "con comida",
  "startDate": "2026-04-14T00:00:00.000Z",
  "endDate": "2026-04-20T00:00:00.000Z",
  "schedule": ["2026-04-14T08:00:00.000Z", "2026-04-14T20:00:00.000Z"]
}
```

Notas:

- `schedule` es una lista de datetimes ISO (instantes).

Response:

```json
{ "medication": { "id": "..." } }
```

### PUT /medications/:id

Body (parcial, campos opcionales):

```json
{ "instructions": "tomar con agua" }
```

### PATCH /medications/:id/status

Body:

```json
{ "status": "SUSPENDED" }
```

Estados validos: `ACTIVE | COMPLETED | SUSPENDED`.

### DELETE /medications/:id

Response:

```json
{ "success": true }
```

## Events (Semana 3, on-demand)

Todos requieren Bearer token.

### Como se crean los events

Cuando el frontend llama `GET /events/today` o `GET /events/week`, el backend:

- Busca medicamentos `ACTIVE` del usuario.
- Toma `Medication.schedule` (ISO datetimes).
- Crea `MedicationEvent` faltantes dentro del rango consultado.
- Devuelve la lista de eventos.

### GET /events

Query params opcionales:

- `from` (ISO datetime)
- `to` (ISO datetime)
- `medicationId`
- `status` (`PENDING | TAKEN | MISSED`)

Ejemplo:

`GET /events?from=2026-04-14T00:00:00.000Z&to=2026-04-15T00:00:00.000Z`

Response:

```json
{
  "events": [
    {
      "id": "...",
      "medicationId": "...",
      "dateTimeScheduled": "...",
      "status": "PENDING"
    }
  ]
}
```

### GET /events/today

Devuelve los eventos del dia (rango segun `User.timezone`) y crea faltantes.

### GET /events/week

Devuelve los eventos de la semana (rango segun `User.timezone`) y crea faltantes.

### PATCH /events/:id/mark-taken

Response:

```json
{ "event": { "id": "...", "status": "TAKEN" } }
```

### PATCH /events/:id/mark-missed

Response:

```json
{ "event": { "id": "...", "status": "MISSED" } }
```

## Adherence (Semana 3)

Todos requieren Bearer token.

`adherenceRate` se calcula como `taken / (taken + missed + pending)`.

### GET /adherence/today

### GET /adherence/week

### GET /adherence/month

Response (ejemplo):

```json
{
  "taken": 1,
  "missed": 0,
  "pending": 1,
  "total": 2,
  "adherenceRate": 0.5
}
```

### GET /adherence/stats

Incluye tambien:

```json
{ "activeMedications": 2 }
```

## Health (Semana 3)

Todos requieren Bearer token.

### GET /health/profile

Response:

```json
{ "health": { "userId": "...", "weight": null, "height": null, "imc": null } }
```

### POST /health/weight

Body:

```json
{ "weight": 70 }
```

Response:

```json
{ "health": { "weight": 70, "imc": null } }
```

### GET /health/imc

Response:

```json
{ "imc": null }
```

### GET /health/polypharmacy

Response:

```json
{ "activeMedications": 2, "polypharmacy": false }
```

## Knowledge (RAG)

### Requisitos

- `GET /knowledge/search` requiere Bearer token (cualquier usuario autenticado).
- `POST /knowledge/documents` requiere Bearer token con rol `ADMIN`.

### POST /knowledge/documents

Ingesta todos los PDFs desde `./pdfs_descargados` hacia la base vectorial.

Response (ejemplo):

```json
{
  "folder": "/ruta/al/proyecto/pdfs_descargados",
  "processed": 2,
  "documents": [
    {
      "source": "local:guia1.pdf",
      "documentId": "...",
      "chunks": 145
    }
  ]
}
```

### GET /knowledge/search

Query params:

- `q` (requerido): texto de búsqueda
- `k` (opcional): top resultados, default `10`, rango `1..50`

Ejemplo:

`GET /knowledge/search?q=control%20de%20hipertension&k=5`

Response (ejemplo):

```json
{
  "matches": [
    {
      "chunkId": "...",
      "documentId": "...",
      "page": 12,
      "chunkIndex": 3,
      "content": "...",
      "score": 0.83,
      "docSource": "local:guia1.pdf",
      "docTitle": "guia1.pdf",
      "docMetadata": {
        "kind": "pdf"
      }
    }
  ]
}
```
