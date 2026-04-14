import { Module } from '@nestjs/common';
import { AdherenceController } from './adherence.controller';
import { AdherenceService } from './adherence.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [AdherenceController],
  providers: [AdherenceService],
})
export class AdherenceModule {}
