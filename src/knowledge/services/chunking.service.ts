import { Injectable } from '@nestjs/common';

export type PageChunk = {
  page: number;
  chunkIndex: number;
  content: string;
  category?: string;
  tags?: string[];
};

@Injectable()
export class ChunkingService {
  private readonly categoryKeywords: Record<string, string[]> = {
    cardiovascular: [
      'cardiovascular',
      'cardiaco',
      'cardíaco',
      'corazón',
      'arterial',
      'hipertensión',
      'infarto',
      'angina',
      'insuficiencia cardíaca',
      'arritmia',
      'fibrilación auricular',
    ],
    metabolica: [
      'diabetes',
      'metabólico',
      'metabólica',
      'obesidad',
      'colesterol',
      'dislipidemia',
      'síndrome metabólico',
      'glucosa',
      'insulina',
    ],
    respiratoria: [
      'respiratorio',
      'respiratoria',
      'pulmón',
      'pulmonar',
      'EPOC',
      'asma',
      'bronquitis',
      'fibrosis',
    ],
    renal: [
      'renal',
      'riñón',
      'nefropatía',
      'diálisis',
      'insuficiencia renal',
    ],
    neurologico: [
      'neurológico',
      'neurológica',
      'cerebrovascular',
      'ACV',
      'ictus',
      'demencia',
      'alzheimer',
    ],
    medicamentos: [
      'medicamento',
      'fármaco',
      'droga',
      'tratamiento',
      'terapia',
      'dosis',
      'administración',
    ],
  };

  private detectCategory(text: string): string | null {
    const lower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matches = keywords.filter((kw) => lower.includes(kw));
      if (matches.length >= 2) return category;
    }
    return null;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();

    const tagPatterns: Record<string, string[]> = {
      'hipertensión': ['hipertensión', 'HTA', 'presión arterial'],
      'diabetes-t2': ['diabetes tipo 2', 'diabetes mellitus tipo 2', 'DM2'],
      'diabetes-t1': ['diabetes tipo 1', 'diabetes mellitus tipo 1', 'DM1'],
      'enfermedad-coronaria': ['enfermedad arterial coronaria', 'IAM', 'infarto'],
      'insuficiencia-cardiaca': ['insuficiencia cardíaca', 'ICC', 'falla cardíaca'],
      'EPOC': ['EPOC', 'enfermedad pulmonar obstructiva crónica'],
      'dislipidemia': ['dislipidemia', 'hipercolesterolemia', 'colesterol alto'],
      'obesidad': ['obesidad', 'IMC', 'índice de masa corporal'],
      'ACV': ['ACV', 'accidente cerebrovascular', 'ictus'],
      'nefropatia': ['nefropatía', 'enfermedad renal', 'insuficiencia renal'],
    };

    for (const [tag, patterns] of Object.entries(tagPatterns)) {
      if (patterns.some((p) => lower.includes(p))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  private splitByParagraphs(text: string): string[] {
    const paragraphs = text
      .split(/\n\s*\n|\n(?=[●○•]|\d+\.|\[)/)
      .map((p) => p.trim())
      .filter((p) => p.length > 50);

    return paragraphs.length > 0 ? paragraphs : [text];
  }

  chunkPages(
    pages: Array<{ page: number; text: string }>,
    opts?: { chunkSize?: number; overlap?: number; semantic?: boolean },
  ): PageChunk[] {
    const chunkSize = opts?.chunkSize ?? 800;
    const overlap = opts?.overlap ?? 100;
    const semantic = opts?.semantic ?? true;

    const chunks: PageChunk[] = [];

    for (const p of pages) {
      if (!p.text || p.text.trim().length === 0) continue;

      if (semantic) {
        const paragraphs = this.splitByParagraphs(p.text);
        let currentChunk = '';
        let chunkIndex = 0;

        for (const paragraph of paragraphs) {
          if (currentChunk.length + paragraph.length <= chunkSize) {
            currentChunk += (currentChunk ? ' ' : '') + paragraph;
          } else {
            if (currentChunk.trim()) {
              chunks.push({
                page: p.page,
                chunkIndex: chunkIndex++,
                content: currentChunk.trim(),
                category: this.detectCategory(currentChunk) || undefined,
                tags: this.extractTags(currentChunk),
              });
            }
            currentChunk = paragraph;
          }
        }

        if (currentChunk.trim()) {
          chunks.push({
            page: p.page,
            chunkIndex: chunkIndex++,
            content: currentChunk.trim(),
            category: this.detectCategory(currentChunk) || undefined,
            tags: this.extractTags(currentChunk),
          });
        }
      } else {
        const step = Math.max(1, chunkSize - overlap);
        let idx = 0;

        for (let start = 0; start < p.text.length; start += step) {
          const slice = p.text.slice(start, start + chunkSize).trim();
          if (slice.length === 0) continue;

          chunks.push({
            page: p.page,
            chunkIndex: idx++,
            content: slice,
            category: this.detectCategory(slice) || undefined,
            tags: this.extractTags(slice),
          });
        }
      }
    }

    return chunks;
  }
}
