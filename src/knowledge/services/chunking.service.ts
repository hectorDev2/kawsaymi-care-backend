import { Injectable } from '@nestjs/common';

export type PageChunk = {
  page: number;
  chunkIndex: number;
  content: string;
};

@Injectable()
export class ChunkingService {
  chunkPages(
    pages: Array<{ page: number; text: string }>,
    opts?: { chunkSize?: number; overlap?: number },
  ): PageChunk[] {
    const chunkSize = opts?.chunkSize ?? 1000;
    const overlap = opts?.overlap ?? 150;
    const step = Math.max(1, chunkSize - overlap);

    const chunks: PageChunk[] = [];
    for (const p of pages) {
      if (!p.text || p.text.trim().length === 0) continue;

      let idx = 0;
      for (let start = 0; start < p.text.length; start += step) {
        const slice = p.text.slice(start, start + chunkSize).trim();
        if (slice.length === 0) continue;
        chunks.push({ page: p.page, chunkIndex: idx++, content: slice });
      }
    }

    return chunks;
  }
}
