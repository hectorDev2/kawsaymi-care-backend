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
      if (existing && existing.chunks > 0) {
        if (!force) continue;
        await this.vectorDb.deleteChunksByDocumentId(existing.id);
      }

      const pages = await this.pdf.extractPagesFromFile(filePath);
      const chunks = this.chunker.chunkPages(pages);
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
          ingestComplete: false,
        },
      });

      const documentId = doc.id;

      // Hard idempotency: do not delete existing chunks. On retries, insert will
      // upsert per unique key; we also skip keys that already exist to avoid
      // re-embedding work.
      const existingKeys =
        await this.vectorDb.getExistingChunkKeysByDocumentId(documentId);

      // Embed missing chunks in batches.
      const batchSize = 5;
      let inserted = 0;
      const missing = chunks.filter(
        (c) => !existingKeys.has(`${c.page}:${c.chunkIndex}`),
      );

      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
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
          })),
        );
        inserted += batch.length;

        if (i + batchSize < missing.length) {
          await new Promise((r) => setTimeout(r, 4000));
        }
      }

      // Mark as complete (used for future idempotency checks / debugging).
      await this.vectorDb.upsertDocument({
        source,
        title: fileName,
        metadata: {
          kind: 'pdf',
          fileName,
          ingestedFrom: 'pdfs_descargados',
          pages: pages.length,
          ingestComplete: true,
        },
      });

      results.push({ source, documentId, chunks: inserted });
    }

    return {
      folder: this.folderPath,
      processed: results.length,
      documents: results,
    };
  }
}
