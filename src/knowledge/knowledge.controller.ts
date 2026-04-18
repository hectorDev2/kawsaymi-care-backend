import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { IngestService } from './services/ingest.service';
import { EmbeddingsService } from './services/embeddings.service';
import { VectorDbService } from './services/vector-db.service';
import { KnowledgeAnswerDto } from './dto/answer.dto';
import { GroqService } from './services/groq.service';
import { VectorSearchMatch } from './services/vector-db.service';

type KnowledgeAnswerResponse =
  | {
      answer: string;
      sources: Array<{
        id: string;
        source: string;
        title: string | null;
        page: number;
        chunkIndex: number;
        score: number;
      }>;
    }
  | {
      answer: string;
      sources: Array<{
        id: string;
        source: string;
        title: string | null;
        page: number;
        chunkIndex: number;
        score: number;
      }>;
      matches: VectorSearchMatch[];
      rawMatches: VectorSearchMatch[];
      scoreMin: number;
    };

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly ingest: IngestService,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorDb: VectorDbService,
    private readonly groq: GroqService,
  ) {}

  @ApiOperation({
    summary: 'Ingesta PDFs desde ./pdfs_descargados (ADMIN)',
  })
  @ApiBearerAuth()
  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async ingestLocalFolder() {
    const result = await this.ingest.ingestLocalFolder();
    return result;
  }

  @ApiOperation({ summary: 'Semantic search (auth)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'k', required: false, description: 'Top K (default 10)' })
  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('q') q: string, @Query('k') k?: string) {
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('q is required');
    }

    const topK = k ? Number(k) : 10;
    if (!Number.isFinite(topK) || topK <= 0 || topK > 50) {
      throw new BadRequestException('k must be a number between 1 and 50');
    }

    const embedding = await this.embeddings.embedQuery(q);
    const matches = await this.vectorDb.matchDocumentChunks(embedding, topK);
    return { matches };
  }

  @ApiOperation({ summary: 'RAG answer using Groq (auth)' })
  @ApiBearerAuth()
  @Post('answer')
  @UseGuards(JwtAuthGuard)
  async answer(
    @Body() dto: KnowledgeAnswerDto,
  ): Promise<KnowledgeAnswerResponse> {
    const q = dto.q?.trim();
    if (!q) {
      throw new BadRequestException('q is required');
    }

    const k = dto.k ?? 6;
    const embedding = await this.embeddings.embedQuery(q);
    const scoreMin = dto.scoreMin ?? 0.8;
    const debug = dto.debug === true;

    const rawMatches = await this.vectorDb.matchDocumentChunks(
      embedding,
      Math.min(50, Math.max(k * 3, k)),
    );

    // Filter low-signal chunks (bibliography/URLs/mostly numeric) and apply score threshold.
    const filtered = rawMatches.filter((m) => {
      if (m.score < scoreMin) return false;
      const text = (m.content ?? '').trim();
      if (text.length < 80) return false;

      const lower = text.toLowerCase();
      if (
        lower.includes('bibliograf') ||
        lower.includes('referenc') ||
        lower.includes('references')
      ) {
        return false;
      }

      // Too many URLs relative to text.
      const urls = (text.match(/https?:\/\//g) ?? []).length;
      if (urls >= 2) return false;

      // Mostly numeric (tables, codes) tends to be unhelpful for QA.
      const digits = (text.match(/[0-9]/g) ?? []).length;
      if (digits / Math.max(1, text.length) > 0.25) return false;

      return true;
    });

    const matches = filtered.slice(0, k);

    // Build a compact context window.
    const maxChars = 12000;
    let used = 0;
    const parts: string[] = [];
    const sources = matches.map((m, idx) => ({
      id: `S${idx + 1}`,
      source: m.docSource,
      title: m.docTitle,
      page: m.page,
      chunkIndex: m.chunkIndex,
      score: m.score,
    }));

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const id = `S${i + 1}`;
      const header = `[${id}] ${m.docSource} p.${m.page} chunk:${m.chunkIndex} (score:${m.score.toFixed(
        3,
      )})`;
      const block = `${header}\n${m.content}`;
      if (used + block.length + 2 > maxChars) break;
      parts.push(block);
      used += block.length + 2;
    }

    const context = parts.join('\n\n');
    const answer = await this.groq.generateAnswer({
      question: q,
      context,
    });

    if (debug) {
      return { answer, sources, matches, rawMatches, scoreMin };
    }

    return { answer, sources };
  }
}
