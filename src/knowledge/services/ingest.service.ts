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

  async ingestLocalFolder(): Promise<{
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

      // Idempotency: if the document already exists and has chunks, skip it.
      // If it exists but has 0 chunks (previous ingest interrupted), re-process.
      const existing = await this.vectorDb.getDocumentStatusBySource(source);
      if (existing && existing.chunks > 0) {
        continue;
      }

      const pages = await this.pdf.extractPagesFromFile(filePath);
      const chunks = this.chunker.chunkPages(pages);
      if (chunks.length === 0) {
        continue;
      }

      // Upsert document, then replace all chunks.
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
      await this.vectorDb.deleteChunksByDocumentId(documentId);

      // Embed in batches.
      const batchSize = 32;
      let inserted = 0;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
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
