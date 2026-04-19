import { Injectable, InternalServerErrorException } from '@nestjs/common';

type CohereEmbedResponse = {
  embeddings: { float: number[][] };
};

@Injectable()
export class EmbeddingsService {
  private readonly apiKey = process.env.COHERE_API_KEY;
  private readonly model =
    process.env.COHERE_EMBED_MODEL ?? 'embed-multilingual-light-v3.0';
  private readonly baseUrl = 'https://api.cohere.com/v2/embed';

  private l2Normalize(vec: number[]): number[] {
    let sum = 0;
    for (const v of vec) sum += v * v;
    const norm = Math.sqrt(sum) || 1;
    return vec.map((v) => v / norm);
  }

  private async embed(
    texts: string[],
    inputType: 'search_query' | 'search_document',
  ): Promise<number[][]> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('COHERE_API_KEY is not configured');
    }

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        texts,
        input_type: inputType,
        embedding_types: ['float'],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Cohere API error: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`,
      );
    }

    const data = (await res.json()) as CohereEmbedResponse;
    return data.embeddings.float.map((v) => this.l2Normalize(v));
  }

  async embedQuery(query: string): Promise<number[]> {
    const [v] = await this.embed([query], 'search_query');
    return v;
  }

  async embedPassages(passages: string[]): Promise<number[][]> {
    return this.embed(passages, 'search_document');
  }
}
