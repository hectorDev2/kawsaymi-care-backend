import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { readdir } from 'node:fs/promises';
import * as path from 'node:path';
import { PdfTextService } from './pdf-text.service';
import { ChunkingService } from './chunking.service';
import { EmbeddingsService } from './embeddings.service';
import { VectorDbService } from './vector-db.service';

@Injectable()
export class IngestService {
  private readonly folderPath = path.join(process.cwd(), 'pdfs_descargados');

  constructor(
    private readonly pdf: PdfTextService,
    private readonly chunker: ChunkingService,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorDb: VectorDbService,
  ) {}

  private shouldReembed(existing: {
    ingestComplete: boolean | null;
    embeddingProvider?: unknown;
    embeddingModel?: unknown;
    embeddingDims?: unknown;
  }): boolean {
    // If we don't have metadata about the embedding config, we can't trust
    // the stored vectors to match the current query embedder.
    const info = this.embeddings.getInfo();
    if (existing.ingestComplete !== true) return true;
    if (existing.embeddingProvider !== info.provider) return true;
    if (existing.embeddingModel !== info.model) return true;
    if (existing.embeddingDims !== info.dims) return true;
    return false;
  }

  async ingestLocalFolder(force = false): Promise<{
    folder: string;
    processed: number;
    documents: Array<{ source: string; documentId: string; chunks: number }>;
  }> {
    let entries: string[];
    try {
      entries = await readdir(this.folderPath);
    } catch {
      throw new InternalServerErrorException(
        `Failed to read folder: ${this.folderPath}`,
      );
    }

    const pdfs = entries.filter((f) => f.toLowerCase().endsWith('.pdf'));
    const results: Array<{
      source: string;
      documentId: string;
      chunks: number;
    }> = [];

    for (const fileName of pdfs) {
      const filePath = path.join(this.folderPath, fileName);
      const source = `local:${fileName}`;

      const existing = await this.vectorDb.getDocumentStatusBySource(source);
      const existingId = existing?.id ?? null;
      const shouldReembedDoc =
        force === true ||
        (existing && existing.chunks > 0
          ? this.shouldReembed(existing)
          : false);

      if (existing && existing.chunks > 0) {
        if (!shouldReembedDoc) continue;
      }

      const pages = await this.pdf.extractPagesFromFile(filePath);
      // Chunking semántico con detección de categorías y tags
      const chunks = this.chunker.chunkPages(pages, {
        chunkSize: 800,
        overlap: 100,
        semantic: true,
      });
      if (chunks.length === 0) {
        continue;
      }

      // Upsert document.
      const doc = await this.vectorDb.upsertDocument({
        source,
        title: fileName,
        metadata: {
          kind: 'pdf',
          fileName,
          ingestedFrom: 'pdfs_descargados',
          pages: pages.length,
          embeddingProvider: this.embeddings.getInfo().provider,
          embeddingModel: this.embeddings.getInfo().model,
          embeddingDims: this.embeddings.getInfo().dims,
          ingestComplete: false,
        },
      });

      const documentId = doc.id;

      // If we are switching embedding configs, keep availability by re-ingesting
      // first (upsert) and pruning afterwards, instead of deleting upfront.
      // For a brand-new document, pruning is a no-op.

      // Idempotency:
      // - Normal runs: only embed missing (page, chunkIndex).
      // - Re-embed runs (force or embedding config mismatch): embed ALL chunks
      //   so embeddings are actually updated.
      const existingKeys = shouldReembedDoc
        ? new Set<string>()
        : await this.vectorDb.getExistingChunkKeysByDocumentId(documentId);

      // Voyage free tier: 3 RPM / 10K TPM. batchSize=5 @ ~400 tokens/chunk = 2K tokens/batch, safe.
      const batchSize = 5;
      let inserted = 0;
      const toEmbed = shouldReembedDoc
        ? chunks
        : chunks.filter((c) => !existingKeys.has(`${c.page}:${c.chunkIndex}`));

      for (let i = 0; i < toEmbed.length; i += batchSize) {
        const batch = toEmbed.slice(i, i + batchSize);
        const embeddings = await this.embeddings.embedPassages(
          batch.map((c) => c.content),
        );

        await this.vectorDb.insertChunks(
          batch.map((c, idx) => ({
            documentId,
            page: c.page,
            chunkIndex: c.chunkIndex,
            content: c.content,
            embedding: embeddings[idx],
            category: c.category,
            tags: c.tags || [],
          })),
        );
        inserted += batch.length;

        if (i + batchSize < toEmbed.length) {
          await new Promise((r) => setTimeout(r, 21_000));
        }
      }

      // Prune chunks that no longer exist in the current extraction/chunking.
      // This keeps chunks unique and prevents stale leftovers when a PDF changes.
      const chunksPerPage: number[] = Array.from(
        { length: pages.length },
        () => 0,
      );
      for (const c of chunks) {
        if (c.page >= 1 && c.page <= pages.length) {
          chunksPerPage[c.page - 1] = Math.max(
            chunksPerPage[c.page - 1],
            c.chunkIndex + 1,
          );
        }
      }
      await this.vectorDb.pruneChunksByPageCounts({
        documentId,
        pagesCount: pages.length,
        chunksPerPage,
      });

      // Mark as complete (used for future idempotency checks / debugging).
      await this.vectorDb.upsertDocument({
        source,
        title: fileName,
        metadata: {
          kind: 'pdf',
          fileName,
          ingestedFrom: 'pdfs_descargados',
          pages: pages.length,
          embeddingProvider: this.embeddings.getInfo().provider,
          embeddingModel: this.embeddings.getInfo().model,
          embeddingDims: this.embeddings.getInfo().dims,
          ingestComplete: true,
        },
      });

      // If this doc existed under a previous id (shouldn't happen because source is unique),
      // we avoid deleting upfront and also avoid deleting here unless it was truly different.
      // This is defensive and should be a no-op.
      if (existingId && existingId !== documentId) {
        await this.vectorDb.deleteChunksByDocumentId(existingId);
      }

      results.push({ source, documentId, chunks: inserted });
    }

    return {
      folder: this.folderPath,
      processed: results.length,
      documents: results,
    };
  }
}
