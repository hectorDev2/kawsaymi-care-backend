import { Module } from '@nestjs/common';
import { AdherenceController } from './adherence.controller';
import { AdherenceService } from './adherence.service';
import { EventsService } from '../events/events.service';

@Module({
  controllers: [AdherenceController],
  providers: [AdherenceService, EventsService],
})
export class AdherenceModule {}
