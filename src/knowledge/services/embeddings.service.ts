import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

type VoyageEmbedResponse = {
  data: Array<{ embedding: number[]; index: number }>;
};

@Injectable()
export class EmbeddingsService {
  private readonly apiKey = process.env.VOYAGE_API_KEY;
  private readonly model =
    process.env.VOYAGE_EMBED_MODEL ?? 'voyage-3-lite';
  private readonly provider = 'voyage' as const;
  private readonly expectedDims = Number(process.env.EMBEDDING_DIMS ?? 512);
  private readonly baseUrl = 'https://api.voyageai.com/v1/embeddings';

  private l2Normalize(vec: number[]): number[] {
    let sum = 0;
    for (const v of vec) sum += v * v;
    const norm = Math.sqrt(sum) || 1;
    return vec.map((v) => v / norm);
  }

  private async embed(
    texts: string[],
    inputType: 'query' | 'document',
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('VOYAGE_API_KEY is not configured');
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        input_type: inputType,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const detail = text ? ` — ${text}` : '';

      if (res.status === 429) {
        throw new HttpException(
          `Embedding provider rate limit reached (${this.provider}/${this.model}). Retry later or use a key with higher quota.${detail}`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new InternalServerErrorException(
        `Embedding API error (${this.provider}/${this.model}): ${res.status} ${res.statusText}${detail}`,
      );
    }

    const data = (await res.json()) as VoyageEmbedResponse;
    const sorted = data.data.sort((a, b) => a.index - b.index);

    for (const item of sorted) {
      const v = item.embedding;
      if (!Array.isArray(v) || v.length !== this.expectedDims) {
        throw new InternalServerErrorException(
          `Embedding dims mismatch. Expected ${this.expectedDims}, got ${Array.isArray(v) ? v.length : 'unknown'} (provider=${this.provider}, model=${this.model})`,
        );
      }
    }

    return sorted.map((item) => this.l2Normalize(item.embedding));
  }

  async embedQuery(query: string): Promise<number[]> {
    const [v] = await this.embed([query], 'query');
    return v;
  }

  async embedPassages(passages: string[]): Promise<number[][]> {
    return this.embed(passages, 'document');
  }

  getInfo(): {
    provider: string;
    model: string;
    dims: number;
    normalized: boolean;
  } {
    return {
      provider: this.provider,
      model: this.model,
      dims: this.expectedDims,
      normalized: true,
    };
  }
}
