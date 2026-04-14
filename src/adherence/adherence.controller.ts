import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdherenceService } from './adherence.service';

@Controller('adherence')
@UseGuards(JwtAuthGuard)
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  @Get('today')
  today(@GetUser() user: User) {
    return this.adherenceService.today(user.id);
  }

  @Get('week')
  week(@GetUser() user: User) {
    return this.adherenceService.week(user.id);
  }

  @Get('month')
  month(@GetUser() user: User) {
    return this.adherenceService.month(user.id);
  }

  @Get('stats')
  stats(@GetUser() user: User) {
    return this.adherenceService.stats(user.id);
  }
}
