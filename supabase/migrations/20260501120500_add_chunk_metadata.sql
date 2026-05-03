-- Agregar columnas de metadata a knowledge_document_chunks
-- category: categoría detectada automáticamente (cardiovascular, metabolica, respiratoria, etc.)
-- tags: array de tags específicos (hipertensión, diabetes-t2, EPOC, etc.)

ALTER TABLE public.knowledge_document_chunks
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS tags text[];

CREATE INDEX IF NOT EXISTS knowledge_document_chunks_category_idx
  ON public.knowledge_document_chunks USING btree (category);

CREATE INDEX IF NOT EXISTS knowledge_document_chunks_tags_idx
  ON public.knowledge_document_chunks USING gin (tags);

COMMENT ON COLUMN public.knowledge_document_chunks.category IS 
  'Categoría detectada automáticamente: cardiovascular, metabolica, respiratoria, renal, neurologico, medicamentos';

COMMENT ON COLUMN public.knowledge_document_chunks.tags IS 
  'Tags específicos extraídos del contenido: hipertensión, diabetes-t2, EPOC, etc.';
