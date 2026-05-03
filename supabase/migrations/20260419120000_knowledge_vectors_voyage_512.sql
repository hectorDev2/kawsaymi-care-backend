-- Migrate vector dimensions from 384 (Cohere) to 512 (Voyage AI voyage-3-lite)

-- Delete all chunks first (will be re-embedded with Voyage 512 dims)
TRUNCATE public.knowledge_document_chunks;

DROP INDEX IF EXISTS public.knowledge_document_chunks_embedding_ivfflat_idx;

DROP FUNCTION IF EXISTS public.match_document_chunks(extensions.vector(384), int);

ALTER TABLE public.knowledge_document_chunks
  DROP COLUMN embedding;

ALTER TABLE public.knowledge_document_chunks
  ADD COLUMN embedding extensions.vector(512) NOT NULL;

CREATE INDEX IF NOT EXISTS knowledge_document_chunks_embedding_ivfflat_idx
  ON public.knowledge_document_chunks
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding extensions.vector(512),
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
    1 - (c.embedding <=> query_embedding) AS score,
    d.source AS doc_source,
    d.title AS doc_title,
    d.metadata AS doc_metadata
  FROM public.knowledge_document_chunks c
  JOIN public.knowledge_documents d ON d.id = c.document_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
