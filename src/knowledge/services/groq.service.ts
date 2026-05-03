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

  async generateSuggestion(params: {
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
          'Sos un asistente clínico especializado en enfermedades crónicas y medicamentos en Perú. Respondé SIEMPRE en español rioplatense. Usá únicamente el CONTEXTO provisto. Generá una sugerencia concisa en 2 o 3 puntos usando formato **negrita** para los títulos. Si el contexto no alcanza, decí "No tengo información suficiente en la base de conocimiento". NUNCA inventes datos médicos. Incluí una advertencia breve: "Esta información es orientativa y no reemplaza la consulta médica."',
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
        max_tokens: 400,
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
          'Sos un asistente clínico especializado en enfermedades crónicas y medicamentos en Perú. Respondé SIEMPRE en español rioplatense. Usá ÚNICAMENTE el CONTEXTO provisto de documentos médicos. Si la información no está en el contexto, decí "No tengo suficiente información en la base de conocimiento para responder con certeza". NUNCA inventes datos médicos. Al final incluí una sección "📚 Fuentes" con bullets que referencien los IDs de los fragments (ej: [S1], [S2]). Incluí una advertencia: "Esta información es orientativa y no reemplaza la consulta médica profesional."',
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
        max_tokens: 1000,
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
