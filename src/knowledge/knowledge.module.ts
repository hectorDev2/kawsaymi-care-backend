import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeController } from './knowledge.controller';
import { VectorDbService } from './services/vector-db.service';
import { EmbeddingsService } from './services/embeddings.service';
import { PdfTextService } from './services/pdf-text.service';
import { ChunkingService } from './services/chunking.service';
import { IngestService } from './services/ingest.service';
import { GroqService } from './services/groq.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KnowledgeController],
  providers: [
    VectorDbService,
    EmbeddingsService,
    PdfTextService,
    ChunkingService,
    IngestService,
    GroqService,
  ],
})
export class KnowledgeModule {}
