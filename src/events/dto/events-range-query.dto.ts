import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EventsRangeQueryDto {
  @ApiPropertyOptional({
    example: '2026-04-14T00:00:00.000Z',
    description: 'Inicio del rango (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-04-21T00:00:00.000Z',
    description: 'Fin del rango (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    example: 'clx...',
    description: 'Filtrar por ID de medicamento',
  })
  @IsOptional()
  @IsString()
  medicationId?: string;

  @ApiPropertyOptional({
    example: 'PENDING',
    description: 'Filtrar por estado: PENDING | TAKEN | MISSED',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
