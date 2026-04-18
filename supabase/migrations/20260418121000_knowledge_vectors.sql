-- Knowledge base tables (pgvector) + search RPC

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Tables
CREATE TABLE IF NOT EXISTS public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL UNIQUE,
  title text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.knowledge_document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,
  page int NOT NULL,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding extensions.vector(384) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, page, chunk_index)
);

CREATE INDEX IF NOT EXISTS knowledge_document_chunks_document_id_idx
  ON public.knowledge_document_chunks(document_id);

-- Vector index (cosine distance)
CREATE INDEX IF NOT EXISTS knowledge_document_chunks_embedding_ivfflat_idx
  ON public.knowledge_document_chunks
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_documents_set_updated_at ON public.knowledge_documents;
CREATE TRIGGER knowledge_documents_set_updated_at
BEFORE UPDATE ON public.knowledge_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RPC: cosine similarity search over chunks
CREATE OR REPLACE FUNCTION public.match_document_chunks(
  query_embedding extensions.vector(384),
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
