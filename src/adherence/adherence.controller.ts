import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AdherenceService } from './adherence.service';

@ApiTags('Adherence')
@ApiBearerAuth()
@Controller('adherence')
export class AdherenceController {
  constructor(private readonly adherenceService: AdherenceService) {}

  @ApiOperation({
    summary: 'Adherencia de hoy — taken/missed/pending y porcentaje',
  })
  @ApiResponse({ status: 200, description: 'Adherencia del día' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('today')
  today(@GetUser() user: User) {
    return this.adherenceService.today(user.id);
  }

  @ApiOperation({ summary: 'Adherencia de la semana actual' })
  @ApiResponse({ status: 200, description: 'Adherencia semanal' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('week')
  week(@GetUser() user: User) {
    return this.adherenceService.week(user.id);
  }

  @ApiOperation({ summary: 'Adherencia del mes actual' })
  @ApiResponse({ status: 200, description: 'Adherencia mensual' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('month')
  month(@GetUser() user: User) {
    return this.adherenceService.month(user.id);
  }

  @ApiOperation({
    summary:
      'Stats generales: adherencia semanal + cantidad de medicamentos activos',
  })
  @ApiResponse({ status: 200, description: 'Stats de adherencia' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('stats')
  stats(@GetUser() user: User) {
    return this.adherenceService.stats(user.id);
  }
}
