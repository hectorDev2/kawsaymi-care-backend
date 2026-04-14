import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { EventsService } from './events.service';
import { EventsRangeQueryDto } from './dto/events-range-query.dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@GetUser() user: User, @Query() query: EventsRangeQueryDto) {
    return this.eventsService.list(user.id, query);
  }

  @Get('today')
  today(@GetUser() user: User) {
    return this.eventsService.today(user.id);
  }

  @Get('week')
  week(@GetUser() user: User) {
    return this.eventsService.week(user.id);
  }

  @Patch(':id/mark-taken')
  markTaken(@GetUser() user: User, @Param('id') id: string) {
    return this.eventsService.mark(user.id, id, 'TAKEN');
  }

  @Patch(':id/mark-missed')
  markMissed(@GetUser() user: User, @Param('id') id: string) {
    return this.eventsService.mark(user.id, id, 'MISSED');
  }
}
