import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { EventsService } from './events.service';
import { EventsRangeQueryDto } from './dto/events-range-query.dto';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @ApiOperation({
    summary:
      'Listar eventos con filtros opcionales de fecha, medicamento y estado',
  })
  @ApiResponse({ status: 200, description: 'Lista de eventos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiQuery({
    name: 'from',
    required: false,
    example: '2026-04-14T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    example: '2026-04-21T00:00:00.000Z',
  })
  @ApiQuery({ name: 'medicationId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'TAKEN', 'MISSED'],
  })
  @Get()
  list(@GetUser() user: User, @Query() query: EventsRangeQueryDto) {
    return this.eventsService.list(user.id, query);
  }

  @ApiOperation({
    summary: 'Eventos de hoy — genera automáticamente si no existen',
  })
  @ApiResponse({ status: 200, description: 'Eventos de hoy' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('today')
  today(@GetUser() user: User) {
    return this.eventsService.today(user.id);
  }

  @ApiOperation({
    summary:
      'Eventos de la semana actual — genera automáticamente si no existen',
  })
  @ApiResponse({ status: 200, description: 'Eventos de la semana' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('week')
  week(@GetUser() user: User) {
    return this.eventsService.week(user.id);
  }

  @ApiOperation({ summary: 'Marcar evento como tomado' })
  @ApiResponse({ status: 200, description: 'Evento marcado como tomado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  @Patch(':id/mark-taken')
  markTaken(@GetUser() user: User, @Param('id') id: string) {
    return this.eventsService.mark(user.id, id, 'TAKEN');
  }

  @ApiOperation({ summary: 'Marcar evento como omitido' })
  @ApiResponse({ status: 200, description: 'Evento marcado como omitido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Evento no encontrado' })
  @Patch(':id/mark-missed')
  markMissed(@GetUser() user: User, @Param('id') id: string) {
    return this.eventsService.mark(user.id, id, 'MISSED');
  }
}
