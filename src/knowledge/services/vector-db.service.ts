import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';

export type VectorSearchMatch = {
  chunkId: string;
  documentId: string;
  page: number;
  chunkIndex: number;
  content: string;
  category: string | null;
  tags: string[] | null;
  score: number;
  docSource: string;
  docTitle: string | null;
  docMetadata: unknown;
};

type DocumentStatusRow = {
  id: string;
  metadata: unknown;
  chunks: number;
};

type MatchRow = {
  chunk_id: string;
  document_id: string;
  page: number;
  chunk_index: number;
  content: string;
  category: string | null;
  tags: string[] | null;
  score: number;
  doc_source: string;
  doc_title: string | null;
  doc_metadata: unknown;
};

@Injectable()
export class VectorDbService {
  private readonly pool: Pool;
  private readonly connectionInfo: {
    host: string | null;
    port: number | null;
    database: string | null;
    user: string | null;
  };

  constructor() {
    const connectionString = process.env.VECTOR_DATABASE_URL;
    if (!connectionString) {
      throw new Error('VECTOR_DATABASE_URL is required');
    }

    // Safe to expose for debugging (no password).
    try {
      const url = new URL(connectionString);
      const port = url.port ? Number(url.port) : null;
      this.connectionInfo = {
        host: url.hostname || null,
        port: Number.isFinite(port) ? port : null,
        database: url.pathname?.replace(/^\//, '') || null,
        user: url.username || null,
      };
    } catch {
      this.connectionInfo = {
        host: null,
        port: null,
        database: null,
        user: null,
      };
    }

    this.pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 10_000,
      statement_timeout: 15_000,
    });
  }

  getDebugConnectionInfo(): {
    host: string | null;
    port: number | null;
    database: string | null;
    user: string | null;
  } {
    return this.connectionInfo;
  }

  async getStats(): Promise<{
    documents: number;
    chunks: number;
    avgChunkChars: number;
    topDocuments: Array<{
      source: string;
      title: string | null;
      chunks: number;
    }>;
  }> {
    const docsRes = await this.pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM public.knowledge_documents`,
    );
    const chunksRes = await this.pool.query<{ n: number }>(
      `SELECT COUNT(*)::int AS n FROM public.knowledge_document_chunks`,
    );
    const avgRes = await this.pool.query<{ n: number }>(
      `SELECT COALESCE(AVG(LENGTH(content)), 0)::int AS n FROM public.knowledge_document_chunks`,
    );
    const topRes = await this.pool.query<{
      source: string;
      title: string | null;
      chunks: number;
    }>(
      `
      SELECT d.source, d.title, COUNT(c.id)::int AS chunks
      FROM public.knowledge_documents d
      JOIN public.knowledge_document_chunks c ON c.document_id = d.id
      GROUP BY d.id
      ORDER BY chunks DESC
      LIMIT 10;
      `,
    );

    return {
      documents: docsRes.rows[0]?.n ?? 0,
      chunks: chunksRes.rows[0]?.n ?? 0,
      avgChunkChars: avgRes.rows[0]?.n ?? 0,
      topDocuments: topRes.rows,
    };
  }

  async getMatchFunctionDefinition(): Promise<string | null> {
    const res = await this.pool.query<{ def: string }>(
      `
      SELECT pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'match_document_chunks'
      ORDER BY p.oid DESC
      LIMIT 1;
      `,
    );
    return res.rows[0]?.def ?? null;
  }

  private toVectorLiteral(values: number[]): string {
    // pgvector accepts "[1,2,3]" string input for vector.
    // Ensure we only pass finite numbers to avoid SQL runtime errors.
    for (const v of values) {
      if (!Number.isFinite(v)) {
        throw new InternalServerErrorException('Invalid embedding value');
      }
    }

    return `[${values.join(',')}]`;
  }

  async upsertDocument(params: {
    source: string;
    title?: string | null;
    metadata?: unknown;
  }): Promise<{ id: string }> {
    const source = params.source;
    const title = params.title ?? null;
    const metadata = params.metadata ?? {};

    let res: { rows: Array<{ id: string }> };
    try {
      res = await this.pool.query<{ id: string }>(
        `
        INSERT INTO public.knowledge_documents (source, title, metadata)
        VALUES ($1, $2, $3)
        ON CONFLICT (source)
        DO UPDATE SET title = EXCLUDED.title, metadata = EXCLUDED.metadata
        RETURNING id;
        `,
        [source, title, metadata],
      );
    } catch (e: unknown) {
      const err = e as {
        code?: unknown;
        hostname?: unknown;
        message?: unknown;
      };
      if (err.code === 'ENOTFOUND') {
        throw new InternalServerErrorException(
          `Vector DB host not found. Check VECTOR_DATABASE_URL (DNS): ${typeof err.hostname === 'string' ? err.hostname : ''}`,
        );
      }

      if (err.code === '42P01') {
        throw new InternalServerErrorException(
          'Vector DB schema missing. Run supabase/migrations/20260418121000_knowledge_vectors.sql in the vector Supabase project (the same one pointed by VECTOR_DATABASE_URL).',
        );
      }

      if (
        typeof err.message === 'string' &&
        err.message.toLowerCase().includes('tenant or user not found')
      ) {
        throw new InternalServerErrorException(
          'Vector DB auth failed (Supabase pooler). Check VECTOR_DATABASE_URL: for pooler it must use username like "postgres.<project-ref>" (not plain "postgres") and the correct password for the vector Supabase project.',
        );
      }

      throw e;
    }

    return { id: res.rows[0].id };
  }

  async getDocumentStatusBySource(source: string): Promise<{
    id: string;
    chunks: number;
    ingestComplete: boolean | null;
    embeddingProvider?: unknown;
    embeddingModel?: unknown;
    embeddingDims?: unknown;
  } | null> {
    const res = await this.pool.query<DocumentStatusRow>(
      `
      SELECT
        d.id,
        d.metadata,
        COUNT(c.id)::int AS chunks
      FROM public.knowledge_documents d
      LEFT JOIN public.knowledge_document_chunks c ON c.document_id = d.id
      WHERE d.source = $1
      GROUP BY d.id, d.metadata
      `,
      [source],
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    const meta: Record<string, unknown> | null =
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : null;
    const ingestValue = meta ? meta['ingestComplete'] : null;
    const ingestComplete =
      typeof ingestValue === 'boolean' ? ingestValue : null;

    const embeddingProvider = meta ? meta['embeddingProvider'] : undefined;
    const embeddingModel = meta ? meta['embeddingModel'] : undefined;
    const embeddingDims = meta ? meta['embeddingDims'] : undefined;

    return {
      id: row.id,
      chunks: row.chunks,
      ingestComplete,
      embeddingProvider,
      embeddingModel,
      embeddingDims,
    };
  }

  async deleteChunksByDocumentId(documentId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM public.knowledge_document_chunks WHERE document_id = $1`,
      [documentId],
    );
  }

  async pruneChunksByPageCounts(params: {
    documentId: string;
    pagesCount: number;
    chunksPerPage: number[]; // 1-indexed pages: chunksPerPage[0] => page 1
  }): Promise<void> {
    const { documentId, pagesCount, chunksPerPage } = params;
    if (pagesCount <= 0) return;
    if (chunksPerPage.length !== pagesCount) {
      throw new InternalServerErrorException(
        `Invalid chunksPerPage length. Expected ${pagesCount}, got ${chunksPerPage.length}`,
      );
    }

    const pages = Array.from({ length: pagesCount }, (_, i) => i + 1);
    const keepCounts = chunksPerPage.map((n) => Math.max(0, Math.floor(n)));

    // Delete chunks that are outside the current (page, chunk_index) range.
    // This makes re-ingestion resilient: we upsert/update first, then prune.
    await this.pool.query(
      `
      WITH target(page, keep_chunks) AS (
        SELECT *
        FROM unnest($2::int[], $3::int[])
      )
      DELETE FROM public.knowledge_document_chunks c
      USING target t
      WHERE c.document_id = $1
        AND c.page = t.page
        AND c.chunk_index >= t.keep_chunks;
      `,
      [documentId, pages, keepCounts],
    );

    // Also prune pages that no longer exist.
    await this.pool.query(
      `
      DELETE FROM public.knowledge_document_chunks
      WHERE document_id = $1
        AND page > $2;
      `,
      [documentId, pagesCount],
    );
  }

  async getExistingChunkKeysByDocumentId(
    documentId: string,
  ): Promise<Set<string>> {
    const res = await this.pool.query<{ page: number; chunk_index: number }>(
      `
      SELECT page, chunk_index
      FROM public.knowledge_document_chunks
      WHERE document_id = $1
      `,
      [documentId],
    );

    const keys = new Set<string>();
    for (const r of res.rows) {
      keys.add(`${r.page}:${r.chunk_index}`);
    }
    return keys;
  }

  async insertChunks(
    chunks: Array<{
      documentId: string;
      page: number;
      chunkIndex: number;
      content: string;
      embedding: number[];
      category?: string;
      tags?: string[];
    }>,
  ): Promise<void> {
    if (chunks.length === 0) return;

    const values: any[] = [];
    const rowsSql: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const base = i * 7;
      rowsSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}::extensions.vector, $${base + 6}, $${base + 7}::text[])`,
      );
      values.push(
        c.documentId,
        c.page,
        c.chunkIndex,
        c.content,
        this.toVectorLiteral(c.embedding),
        c.category || null,
        c.tags || [],
      );
    }

    await this.pool.query(
      `
      INSERT INTO public.knowledge_document_chunks
        (document_id, page, chunk_index, content, embedding, category, tags)
      VALUES ${rowsSql.join(',')}
      ON CONFLICT (document_id, page, chunk_index)
      DO UPDATE SET 
        content = EXCLUDED.content, 
        embedding = EXCLUDED.embedding,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags;
      `,
      values,
    );
  }

  async matchDocumentChunks(
    embedding: number[],
    k: number,
  ): Promise<VectorSearchMatch[]> {
    const vector = this.toVectorLiteral(embedding);
    const res = await this.pool.query(
      `
      SELECT *
      FROM public.match_document_chunks($1::extensions.vector, $2)
      `,
      [vector, k],
    );

    return (res.rows as MatchRow[]).map((r) => ({
      chunkId: r.chunk_id,
      documentId: r.document_id,
      page: r.page,
      chunkIndex: r.chunk_index,
      content: r.content,
      category: r.category,
      tags: r.tags,
      score: Number(r.score),
      docSource: r.doc_source,
      docTitle: r.doc_title,
      docMetadata: r.doc_metadata,
    }));
  }
}
