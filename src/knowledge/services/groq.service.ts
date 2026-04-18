import { Injectable, InternalServerErrorException } from '@nestjs/common';

type GroqChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type GroqChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

@Injectable()
export class GroqService {
  private readonly apiKey = process.env.GROQ_API_KEY;
  private readonly baseUrl =
    process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1';

  async generateAnswer(params: {
    question: string;
    context: string;
    model?: string;
  }): Promise<string> {
    if (!this.apiKey) {
      throw new InternalServerErrorException('GROQ_API_KEY is not configured');
    }

    const model =
      params.model ?? process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

    const messages: GroqChatMessage[] = [
      {
        role: 'system',
        content:
          'Sos un asistente clínico. Respondé SIEMPRE en español. Usá únicamente el CONTEXTO provisto. Si el contexto no alcanza, decí “No tengo suficiente información en la base cargada para responder con certeza”. No inventes. Al final incluí una sección "Fuentes" con bullets que referencien los IDs de los fragments (por ejemplo: [S1], [S2]).',
      },
      {
        role: 'user',
        content: `CONTEXTO:\n${params.context}\n\nPREGUNTA:\n${params.question}`,
      },
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new InternalServerErrorException(
        `Groq request failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ''}`,
      );
    }

    const data = (await res.json()) as GroqChatCompletionResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new InternalServerErrorException('Groq response missing content');
    }
    return content.trim();
  }
}
