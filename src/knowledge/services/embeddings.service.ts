import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import * as path from 'node:path';
type FloatArrayOutput = { tolist(): number[][] };

type Extractor = (
  inputs: string[] | string,
  opts?: { pooling?: 'mean' | 'cls'; normalize?: boolean },
) => Promise<FloatArrayOutput>;

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private extractorPromise: Promise<Extractor> | null = null;

  async onModuleInit() {
    this.logger.log('Pre-warming embedding model...');
    try {
      await this.getExtractor();
      this.logger.log('Embedding model ready');
    } catch (e) {
      this.logger.error(
        'Failed to pre-warm embedding model — first request will be slow',
        e,
      );
    }
  }

  private getExtractor(): Promise<Extractor> {
    if (!this.extractorPromise) {
      this.extractorPromise = (async () => {
        const mod = (await import('@huggingface/transformers')) as unknown as {
          pipeline: (...args: any[]) => Promise<any>;
        };

        const cache_dir = path.join(process.cwd(), '.cache', 'transformers');

        const dtype = (process.env.EMBEDDINGS_DTYPE as 'fp32' | 'q8') ?? 'q8';

        return (await mod.pipeline(
          'feature-extraction',
          'intfloat/multilingual-e5-small',
          {
            dtype,
            cache_dir,
          },
        )) as Extractor;
      })();
    }
    return this.extractorPromise;
  }

  private l2Normalize(vec: number[]): number[] {
    let sum = 0;
    for (const v of vec) sum += v * v;
    const norm = Math.sqrt(sum) || 1;
    return vec.map((v) => v / norm);
  }

  private async embedText(texts: string[]): Promise<number[][]> {
    const extractor = await this.getExtractor();

    // mean pooling + normalize true yields unit vectors, but we normalize again
    // to be robust to upstream changes.
    const out = await extractor(texts, {
      pooling: 'mean',
      normalize: true,
    });

    const vectors = out.tolist();
    return vectors.map((v) => this.l2Normalize(v));
  }

  async embedQuery(query: string): Promise<number[]> {
    const [v] = await this.embedText([`query: ${query}`]);
    return v;
  }

  async embedPassages(passages: string[]): Promise<number[][]> {
    return this.embedText(passages.map((p) => `passage: ${p}`));
  }
}
