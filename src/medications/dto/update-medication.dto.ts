import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateMedicationDto {
  @ApiPropertyOptional({ example: 'Ibuprofeno' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '400mg' })
  @IsOptional()
  @IsString()
  dose?: string;

  @ApiPropertyOptional({ example: 3, description: 'Veces por día' })
  @IsOptional()
  @IsInt()
  @Min(1)
  frequency?: number;

  @ApiPropertyOptional({ example: 8, description: 'Horas entre dosis' })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalHours?: number;

  @ApiPropertyOptional({ example: 'Tomar con comida' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ example: '2026-04-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-05-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    example: ['2026-04-14T08:00:00.000Z', '2026-04-14T16:00:00.000Z'],
    description: 'Horarios de toma en formato ISO 8601',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  schedule?: string[];
}
