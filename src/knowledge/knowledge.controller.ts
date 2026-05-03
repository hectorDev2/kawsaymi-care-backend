import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  InternalServerErrorException,
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
import { KnowledgeSuggestionDto } from './dto/suggestion.dto';
import { GroqService } from './services/groq.service';
import { VectorSearchMatch } from './services/vector-db.service';

type KnowledgeAnswerResponse = {
  answer: string;
  sources: Array<{
    id: string;
    source: string;
    title: string | null;
    page: number;
    chunkIndex: number;
    score: number;
  }>;
  scoreMin: number;
  matches?: VectorSearchMatch[];
  rawMatches?: VectorSearchMatch[];
  debugInfo?: {
    vectorDb?: {
      host: string | null;
      port: number | null;
      database: string | null;
      user: string | null;
    };
    stats?: {
      documents: number;
      chunks: number;
      avgChunkChars: number;
      topDocuments: Array<{
        source: string;
        title: string | null;
        chunks: number;
      }>;
    };
    rpc?: {
      matchDocumentChunksDef: string | null;
    };
    retrieval?: {
      rawCount: number;
      filteredCount: number;
      filterReasons: {
        tooLowScore: number;
        tooShort: number;
        references: number;
        tooManyUrls: number;
        tooManyDigits: number;
        kept: number;
      };
      minScore: number | null;
      maxScore: number | null;
    };
  };
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
    summary:
      'Ingesta PDFs desde ./pdfs_descargados (ADMIN). ?force=true re-embedea aunque ya existan chunks.',
  })
  @ApiBearerAuth()
  @ApiQuery({
    name: 'force',
    required: false,
    description: 'Re-embed existing documents',
  })
  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async ingestLocalFolder(@Query('force') force?: string) {
    const result = await this.ingest.ingestLocalFolder(force === 'true');
    return result;
  }

  @ApiOperation({ summary: 'AI suggestion from knowledge base (auth)' })
  @ApiBearerAuth()
  @Post('suggestion')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async suggestion(
    @Body() dto: KnowledgeSuggestionDto,
  ): Promise<{ suggestion: string; sources: string[] }> {
    try {
      const q = dto.q?.trim();
      if (!q) throw new BadRequestException('q is required');

      const k = dto.k ?? 3;
      const scoreMin = dto.scoreMin ?? 0.75;

      const embedding = await this.embeddings.embedQuery(q);
      const rawMatches = await this.vectorDb.matchDocumentChunks(
        embedding,
        k * 3,
      );

      const filtered = rawMatches
        .filter(
          (m) => m.score >= scoreMin && (m.content ?? '').trim().length >= 80,
        )
        .slice(0, k);

      if (filtered.length === 0) {
        return {
          suggestion:
            'No tengo información suficiente en la base de conocimiento para responder esta consulta.',
          sources: [],
        };
      }

      const context = filtered
        .map((m, i) => `[S${i + 1}]\n${m.content}`)
        .join('\n\n');

      const suggestion = await this.groq.generateSuggestion({
        question: q,
        context,
      });

      const sources = [
        ...new Set(
          filtered.map((m) => m.docTitle ?? m.docSource.replace(/^local:/, '')),
        ),
      ];

      return { suggestion, sources };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        e instanceof Error
          ? e.message
          : 'Unexpected error in /knowledge/suggestion',
      );
    }
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

  @ApiOperation({ summary: 'Active embedding provider info (auth)' })
  @ApiBearerAuth()
  @Get('embedder')
  @UseGuards(JwtAuthGuard)
  getEmbedderInfo() {
    return this.embeddings.getInfo();
  }

  @ApiOperation({ summary: 'RAG answer using Groq (auth)' })
  @ApiBearerAuth()
  @Post('answer')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async answer(
    @Body() dto: KnowledgeAnswerDto,
  ): Promise<KnowledgeAnswerResponse> {
    try {
      const q = dto.q?.trim();
      if (!q) {
        throw new BadRequestException('q is required');
      }

      const k = dto.k ?? 6;
      const scoreMin = dto.scoreMin ?? 0.8;
      const debug = dto.debug === true;

      const embedding = await this.embeddings.embedQuery(q);

      const rawMatches = await this.vectorDb.matchDocumentChunks(
        embedding,
        Math.min(50, k * 3),
      );

      const reasons = {
        tooLowScore: 0,
        tooShort: 0,
        references: 0,
        tooManyUrls: 0,
        tooManyDigits: 0,
        kept: 0,
      };

      let minScore: number | null = null;
      let maxScore: number | null = null;

      const filtered: VectorSearchMatch[] = [];
      for (const m of rawMatches) {
        if (minScore === null || m.score < minScore) minScore = m.score;
        if (maxScore === null || m.score > maxScore) maxScore = m.score;

        if (m.score < scoreMin) {
          reasons.tooLowScore++;
          continue;
        }

        const text = (m.content ?? '').trim();
        if (text.length < 80) {
          reasons.tooShort++;
          continue;
        }

        const lower = text.toLowerCase();
        if (
          lower.includes('bibliograf') ||
          lower.includes('referenc') ||
          lower.includes('references')
        ) {
          reasons.references++;
          continue;
        }

        const urls = (text.match(/https?:\/\//g) ?? []).length;
        if (urls >= 2) {
          reasons.tooManyUrls++;
          continue;
        }

        const digits = (text.match(/[0-9]/g) ?? []).length;
        if (digits / Math.max(1, text.length) > 0.25) {
          reasons.tooManyDigits++;
          continue;
        }

        reasons.kept++;
        filtered.push(m);
      }

      const matches = filtered.slice(0, k);

      if (matches.length === 0) {
        const base: KnowledgeAnswerResponse = {
          answer:
            'No encontré fuentes suficientes en la base de conocimiento para responder esta pregunta con certeza.',
          sources: [],
          scoreMin,
        };
        if (debug) {
          base.matches = [];
          base.rawMatches = rawMatches;
          base.debugInfo = {
            vectorDb: this.vectorDb.getDebugConnectionInfo(),
            stats: await this.vectorDb.getStats(),
            rpc: {
              matchDocumentChunksDef:
                await this.vectorDb.getMatchFunctionDefinition(),
            },
            retrieval: {
              rawCount: rawMatches.length,
              filteredCount: filtered.length,
              filterReasons: reasons,
              minScore,
              maxScore,
            },
          };
        }
        return base;
      }

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
        const header = `[${id}] ${m.docSource} p.${m.page} chunk:${m.chunkIndex} (score:${m.score.toFixed(3)})`;
        const block = `${header}\n${m.content}`;
        if (used + block.length + 2 > maxChars) break;
        parts.push(block);
        used += block.length + 2;
      }

      const context = parts.join('\n\n');
      const answer = await this.groq.generateAnswer({ question: q, context });

      const base: KnowledgeAnswerResponse = { answer, sources, scoreMin };
      if (debug) {
        base.matches = matches;
        base.rawMatches = rawMatches;
        base.debugInfo = {
          vectorDb: this.vectorDb.getDebugConnectionInfo(),
          stats: await this.vectorDb.getStats(),
          rpc: {
            matchDocumentChunksDef:
              await this.vectorDb.getMatchFunctionDefinition(),
          },
          retrieval: {
            rawCount: rawMatches.length,
            filteredCount: filtered.length,
            filterReasons: reasons,
            minScore,
            maxScore,
          },
        };
      }
      return base;
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException(
        e instanceof Error
          ? e.message
          : 'Unexpected error in /knowledge/answer',
      );
    }
  }
}
