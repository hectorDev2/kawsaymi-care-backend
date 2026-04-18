import {
  BadRequestException,
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

@ApiTags('Knowledge')
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly ingest: IngestService,
    private readonly embeddings: EmbeddingsService,
    private readonly vectorDb: VectorDbService,
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
}
