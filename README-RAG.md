# 🧠 RAG Knowledge Base - Kawsaymi Care

Sistema profesional de **Retrieval-Augmented Generation (RAG)** para consultas médicas basadas en documentos PDF.

---

## 📋 Características

| Feature | Descripción |
|---------|-------------|
| **PDF Ingestion** | Extracción automática de texto, chunking semántico, detección de categorías |
| **Embeddings** | Voyage AI (`voyage-3-lite`, 512 dims) - económico y rápido |
| **Vector DB** | Supabase pgvector con índice IVFFlat para búsqueda eficiente |
| **LLM** | Groq API (Llama 3.1 8B) - respuestas rápidas y precisas |
| **Metadata** | Categorías auto-detectadas (cardiovascular, metabólica, etc.) + tags |
| **Filtrado** | Búsqueda por similitud coseno con score mínimo configurable |
| **Citas** | Respuestas con fuentes citadas ([S1], [S2], ...) |
| **Seguridad** | Auth JWT, roles (ADMIN para ingesta), rate limiting |

---

## 🚀 Quick Start

### 1. Ingestar PDFs

Colocá tus PDFs en `pdfs_descargados/` y ejecutá:

```bash
# Como ADMIN
curl -X POST "http://localhost:3001/knowledge/documents" \
  -H "Authorization: Bearer <admin_token>"
```

### 2. Consultar

```bash
# Respuesta completa con fuentes
curl -X POST "http://localhost:3001/knowledge/answer" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"q":"¿Qué medicamentos hay para hipertensión?","k":6}'
```

```bash
# Búsqueda semántica (devuelve chunks)
curl -X GET "http://localhost:3001/knowledge/search?q=diabetes&k=5" \
  -H "Authorization: Bearer <token>"
```

```bash
# Sugerencia concisa
curl -X POST "http://localhost:3001/knowledge/suggestion" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"q":"tratamiento para EPOC"}'
```

---

## 📁 Estructura del Proyecto

```
src/knowledge/
├── dto/
│   ├── answer.dto.ts          # Validación POST /answer
│   └── suggestion.dto.ts      # Validación POST /suggestion
├── services/
│   ├── chunking.service.ts    # Chunking semántico + detección categorías
│   ├── embeddings.service.ts  # Voyage AI integration
│   ├── groq.service.ts        # Groq LLM integration
│   ├── ingest.service.ts      # Orquestación de ingesta PDF
│   ├── pdf-text.service.ts    # Extracción de texto de PDFs
│   └── vector-db.service.ts   # Supabase pgvector operations
├── knowledge.controller.ts    # Endpoints REST
└── knowledge.module.ts        # Módulo NestJS

supabase/migrations/
├── 20260418121000_knowledge_vectors.sql         # Tablas base (512 dims)
├── 20260419120000_knowledge_vectors_voyage_512.sql  # Migración a Voyage
├── 20260501120000_fix_vector_search.sql         # Fix: inner product
├── 20260501120500_add_chunk_metadata.sql        # Columnas category/tags
└── 20260501121000_add_metadata_to_rpc.sql       # RPC con metadata
```

---

## 🔧 Configuración (.env)

```env
# Vector DB (Supabase con pgvector)
VECTOR_DATABASE_URL=postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Voyage AI (embeddings)
VOYAGE_API_KEY=pa-xxx
VOYAGE_EMBED_MODEL=voyage-3-lite
EMBEDDING_DIMS=512

# Groq (LLM)
GROQ_API_KEY=gsk_xxx
GROQ_MODEL=llama-3.1-8b-instant
GROQ_BASE_URL=https://api.groq.com/openai/v1
```

---

## 📊 Endpoints

### POST /knowledge/documents
**Ingesta PDFs desde `pdfs_descargados/`**

- **Auth**: ADMIN required
- **Query params**: `?force=true` (re-embedea aunque ya existan)
- **Respuesta**:
```json
{
  "folder": "/app/pdfs_descargados",
  "processed": 1,
  "documents": [
    {
      "source": "local:BASE DE DATOS.pdf",
      "documentId": "uuid",
      "chunks": 17
    }
  ]
}
```

### POST /knowledge/answer
**RAG: Búsqueda + Generación de respuesta**

- **Auth**: Required
- **Body**:
```json
{
  "q": "¿Qué medicamentos hay para hipertensión?",
  "k": 6,
  "scoreMin": 0.8,
  "debug": false
}
```
- **Respuesta**:
```json
{
  "answer": "Los medicamentos para hipertensión incluyen...\n\n📚 Fuentes:\n- [S1] BASE DE DATOS.pdf p.3\n- [S2] BASE DE DATOS.pdf p.2\n\n⚠️ Esta información es orientativa...",
  "sources": [
    {
      "id": "S1",
      "source": "local:BASE DE DATOS.pdf",
      "title": "BASE DE DATOS.pdf",
      "page": 3,
      "chunkIndex": 2,
      "score": 0.5822
    }
  ],
  "scoreMin": 0.8
}
```

### GET /knowledge/search
**Búsqueda semántica (devuelve chunks)**

- **Auth**: Required
- **Query params**: `q` (required), `k` (default 10, max 50)
- **Respuesta**:
```json
{
  "matches": [
    {
      "chunkId": "uuid",
      "documentId": "uuid",
      "page": 3,
      "chunkIndex": 2,
      "content": "...",
      "category": "cardiovascular",
      "tags": ["hipertensión"],
      "score": 0.5822,
      "docSource": "local:BASE DE DATOS.pdf",
      "docTitle": "BASE DE DATOS.pdf"
    }
  ]
}
```

### POST /knowledge/suggestion
**Sugerencia concisa (2-3 puntos)**

- **Auth**: Required
- **Body**:
```json
{
  "q": "tratamiento para EPOC",
  "k": 3,
  "scoreMin": 0.75
}
```
- **Respuesta**:
```json
{
  "suggestion": "**Broncodilatadores**\n- Beta-2 agonistas...\n\n**Corticoides inhalados**...",
  "sources": ["BASE DE DATOS.pdf"]
}
```

---

## 🧠 Chunking Semántico

El sistema usa chunking inteligente:

1. **Split por párrafos**: Respeta límites naturales del texto
2. **Detección de categoría**: Analiza keywords para asignar:
   - `cardiovascular`
   - `metabolica`
   - `respiratoria`
   - `renal`
   - `neurologico`
   - `medicamentos`
3. **Extracción de tags**: Identifica conceptos específicos:
   - `hipertensión`, `diabetes-t2`, `EPOC`, `ACV`, etc.

**Configuración**:
- Chunk size: 800 chars
- Overlap: 100 chars
- Min párrafo: 50 chars

---

## 💰 Costos Estimados

### Voyage AI (Embeddings)
| Plan | Precio | Límites |
|------|--------|---------|
| Free | $0 | 10K tokens/min, 250K tokens/mes |
| Starter | $0.10/1K tokens | 100K tokens/min |

**Ejemplo PDF "BASE DE DATOS.pdf"** (17 páginas, 17 chunks):
- Ingesta: ~7K tokens → **$0.0007 USD** (one-time)
- Consultas: ~50 tokens/pregunta → **$0.005 por 100 preguntas**

### Groq (LLM)
| Modelo | Precio | Velocidad |
|--------|--------|-----------|
| Llama 3.1 8B | Free (beta) | ~500 tokens/s |
| Llama 3.1 70B | Free (beta) | ~200 tokens/s |

✅ **Muy económico para producción**.

---

## 🔍 Búsqueda Vectorial

### Algoritmo
- **Operador**: Inner product negativo (`<#>`)
- **Embeddings**: Normalizados L2
- **Equivalencia**: Con vectores normalizados, inner product = cosine similarity
- **Score**: -1 a 1 (1 = idéntico)

### Optimización
- **Índice**: IVFFlat con 100 lists
- **Performance**: O(log n) vs O(n) de búsqueda lineal
- **Recomendación**: Para 100K+ chunks, aumentar `lists` a 300-500

---

## 🛡️ Seguridad

### Rate Limiting (pendiente)
```typescript
// TODO: Implementar @nestjs/throttler
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 10, // 10 req/min por usuario
})
```

### Validaciones
- DTOs con `class-validator`
- Score mínimo configurable (default 0.8)
- Máximo 20 chunks por consulta
- Auth JWT requerida (excepto registro/login)

### Prompt Hardening
- "Usá ÚNICAMENTE el CONTEXTO provisto"
- "NUNCA inventes datos médicos"
- "Si no está en el contexto, decilo"
- Advertencia: "No reemplaza consulta médica"

---

## 📈 Mejoras Futuras

### Corto Plazo
- [ ] Streaming SSE para respuestas largas
- [ ] Historial de preguntas (tabla `knowledge_questions`)
- [ ] Filtrado por categoría en búsqueda
- [ ] Cache de embeddings (Redis)
- [ ] Rate limiting con `@nestjs/throttler`

### Mediano Plazo
- [ ] Frontend Next.js con chat UI
- [ ] Múltiples PDFs con búsqueda cruzada
- [ ] Feedback de calidad (thumbs up/down)
- [ ] Analytics de consultas más frecuentes
- [ ] Re-ranking con cross-encoder

### Largo Plazo
- [ ] Fine-tuning de embeddings para dominio médico
- [ ] Hybrid search (vector + full-text BM25)
- [ ] Multi-modal (imágenes médicas + texto)
- [ ] Agentes especializados por categoría

---

## 🐛 Troubleshooting

### "Vector DB schema missing"
Ejecutá las migrations en orden:
```bash
psql $VECTOR_DATABASE_URL -f supabase/migrations/20260418121000_knowledge_vectors.sql
psql $VECTOR_DATABASE_URL -f supabase/migrations/20260419120000_knowledge_vectors_voyage_512.sql
psql $VECTOR_DATABASE_URL -f supabase/migrations/20260501120000_fix_vector_search.sql
psql $VECTOR_DATABASE_URL -f supabase/migrations/20260501120500_add_chunk_metadata.sql
psql $VECTOR_DATABASE_URL -f supabase/migrations/20260501121000_add_metadata_to_rpc.sql
```

### "Embedding dims mismatch"
Verificá que `EMBEDDING_DIMS=512` en `.env` coincida con la migration.

### "Groq request failed: 429"
Rate limit de Groq. Esperá unos segundos o reducí `k` en la consulta.

### "No tengo suficiente información..."
El score de los chunks es menor a `scoreMin`. Reducilo a 0.7 o 0.6.

### Chunks con categoría "N/A"
El chunk no tiene suficientes keywords para detectar categoría. Es normal en chunks cortos o genéricos.

---

## 📚 Referencias

- [pgvector docs](https://github.com/pgvector/pgvector)
- [Voyage AI embeddings](https://docs.voyageai.com/docs/embeddings)
- [Groq API docs](https://console.groq.com/docs)
- [RAG best practices](https://www.llamaIndex.com/blogs/evaluating-and-improving-rag-systems-a-practical-guide)

---

## 📄 Licencia

UNLICENSED - Kawsaymi Care © 2026
