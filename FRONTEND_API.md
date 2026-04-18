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

### Groq (RAG) desde el Frontend

El frontend NO llama a Groq directo. Llama al backend y el backend:

- genera embeddings localmente,
- busca chunks relevantes en la Vector DB (pgvector),
- y recién ahí llama a Groq para redactar una respuesta basada SOLO en ese contexto.

Requisitos en backend (variables de entorno):

```env
GROQ_API_KEY=...
# (Opcional)
# GROQ_MODEL=llama-3.1-8b-instant
# GROQ_BASE_URL=https://api.groq.com/openai/v1
```

Todos los endpoints de Knowledge requieren Bearer token.

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

Uso recomendado en UI:

- Usar `/knowledge/search` si querés armar una pantalla de "resultados" (mostrar snippets y scores).
- Usar `/knowledge/answer` si querés una respuesta conversacional (RAG) y solo mostrar "Fuentes".

### POST /knowledge/answer

Genera una respuesta RAG usando Groq.

Request:

```json
{
  "q": "¿Qué recomienda la guía sobre dengue en adultos?",
  "k": 6,
  "scoreMin": 0.8,
  "debug": false
}
```

Campos:

- `q` (string, requerido): pregunta del usuario.
- `k` (number, opcional, default 6, max 20): cantidad de chunks a usar.
- `scoreMin` (0..1, opcional, default 0.8): umbral mínimo de similitud.
- `debug` (boolean, opcional): si `true` devuelve también los matches crudos (útil para desarrollo).

Response (normal):

```json
{
  "answer": "...",
  "sources": [
    {
      "id": "S1",
      "source": "local:guia1.pdf",
      "title": "guia1.pdf",
      "page": 12,
      "chunkIndex": 3,
      "score": 0.83
    }
  ]
}
```

Response (debug=true) agrega:

- `matches`: los chunks finales usados
- `rawMatches`: candidatos antes del filtro
- `scoreMin`: el umbral aplicado

Ejemplo (curl):

```bash
curl -X POST "http://localhost:3000/knowledge/answer" \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"q":"¿Qué recomienda la guía sobre dengue en adultos?","k":6,"scoreMin":0.8}'
```

Ejemplo (TypeScript en frontend, usando fetch):

```ts
type KnowledgeAnswerBody = {
  q: string;
  k?: number;
  scoreMin?: number;
  debug?: boolean;
};

export async function knowledgeAnswer(
  baseUrl: string,
  accessToken: string,
  body: KnowledgeAnswerBody,
) {
  const res = await fetch(`${baseUrl}/knowledge/answer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    // El backend devuelve { message: string } en errores Nest
    const message = json?.message ?? 'Error consultando knowledge/answer';
    throw new Error(message);
  }
  return json as {
    answer: string;
    sources: Array<{
      id: string;
      source: string;
      title: string | null;
      page: number;
      chunkIndex: number;
      score: number;
    }>;
  };
}
```
