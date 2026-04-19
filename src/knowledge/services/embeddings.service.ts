import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class EmbeddingsService {
  private readonly hfApiKey = process.env.HUGGINGFACE_API_KEY;
  private readonly hfUrl =
    process.env.HUGGINGFACE_API_URL ??
    'https://router.huggingface.co/hf-inference/models/intfloat/multilingual-e5-small/v1/feature-extraction';

  private l2Normalize(vec: number[]): number[] {
    let sum = 0;
    for (const v of vec) sum += v * v;
    const norm = Math.sqrt(sum) || 1;
    return vec.map((v) => v / norm);
  }

  private meanPool(tokenEmbeddings: number[][]): number[] {
    const dims = tokenEmbeddings[0].length;
    const result = new Array<number>(dims).fill(0);
    for (const token of tokenEmbeddings) {
      for (let i = 0; i < dims; i++) {
        result[i] += token[i];
      }
    }
    return result.map((v) => v / tokenEmbeddings.length);
  }

  private async embedText(texts: string[]): Promise<number[][]> {
    if (!this.hfApiKey) {
      throw new InternalServerErrorException(
        'HUGGINGFACE_API_KEY is not configured',
      );
    }

    const res = await fetch(this.hfUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.hfApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `HuggingFace API error: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`,
      );
    }

    // HF feature-extraction returns 3D [batch, seq_len, hidden] or 2D [batch, hidden]
    const data = (await res.json()) as number[][][] | number[][];

    return (data as Array<number[] | number[][]>).map((item) => {
      if (Array.isArray(item[0])) {
        return this.l2Normalize(this.meanPool(item as number[][]));
      }
      return this.l2Normalize(item as number[]);
    });
  }

  async embedQuery(query: string): Promise<number[]> {
    const [v] = await this.embedText([`query: ${query}`]);
    return v;
  }

  async embedPassages(passages: string[]): Promise<number[][]> {
    return this.embedText(passages.map((p) => `passage: ${p}`));
  }
}
