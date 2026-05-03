-- Fix: Usar inner product negativo (<#>) en vez de cosine distance (<=>)
-- Los embeddings de Voyage AI ya vienen normalizados L2, así que inner product es equivalente a cosine similarity
-- pero más eficiente.

DROP FUNCTION IF EXISTS public.match_document_chunks(extensions.vector, integer);

CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding extensions.vector,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  chunk_id uuid,
  document_id uuid,
  page int,
  chunk_index int,
  content text,
  score float8,
  doc_source text,
  doc_title text,
  doc_metadata jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id AS chunk_id,
    c.document_id,
    c.page,
    c.chunk_index,
    c.content,
    -- Inner product negativo: vectores normalizados => equivalente a cosine similarity
    -- Multiplicamos por -1 para que el score más alto sea mejor similitud
    (c.embedding <#> query_embedding) * -1 AS score,
    d.source AS doc_source,
    d.title AS doc_title,
    d.metadata AS doc_metadata
  FROM public.knowledge_document_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  ORDER BY c.embedding <#> query_embedding
  LIMIT match_count;
$$;

COMMENT ON FUNCTION public.match_document_chunks IS 
  'Búsqueda por similitud de vectores usando inner product (embeddings normalizados L2). Score: -1 a 1 (1 = idéntico).';
