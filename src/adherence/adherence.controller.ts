import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdherenceService } from './adherence.service';

@ApiTags('Adherence')
@ApiBearerAuth()
@Controller('adherence')
@UseGuards(JwtAuthGuard)
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  @ApiOperation({ summary: 'Adherencia de hoy — taken/missed/pending y porcentaje' })
  @Get('today')
  today(@GetUser() user: User) {
    return this.adherenceService.today(user.id);
  }

  @ApiOperation({ summary: 'Adherencia de la semana actual' })
  @Get('week')
  week(@GetUser() user: User) {
    return this.adherenceService.week(user.id);
  }

  @ApiOperation({ summary: 'Adherencia del mes actual' })
  @Get('month')
  month(@GetUser() user: User) {
    return this.adherenceService.month(user.id);
  }

  @ApiOperation({ summary: 'Stats generales: adherencia semanal + cantidad de medicamentos activos' })
  @Get('stats')
  stats(@GetUser() user: User) {
    return this.adherenceService.stats(user.id);
  }
}
