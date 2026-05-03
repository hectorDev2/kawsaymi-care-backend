-- Actualizar función RPC para retornar category y tags

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
  category text,
  tags text[],
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
    c.category,
    c.tags,
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
  'Búsqueda por similitud de vectores. Retorna chunk + metadata (category, tags) + score (-1 a 1).';
