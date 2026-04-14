import { ArrayNotEmpty, IsArray, IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMedicationDto {
  @ApiProperty({ example: 'Ibuprofeno' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '400mg' })
  @IsString()
  dose!: string;

  @ApiProperty({ example: 3, description: 'Veces por día' })
  @IsInt()
  @Min(1)
  frequency!: number;

  @ApiProperty({ example: 8, description: 'Horas entre dosis' })
  @IsInt()
  @Min(1)
  intervalHours!: number;

  @ApiPropertyOptional({ example: 'Tomar con comida' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: '2026-04-14T00:00:00.000Z' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: '2026-05-14T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: ['2026-04-14T08:00:00.000Z', '2026-04-14T16:00:00.000Z', '2026-04-14T22:00:00.000Z'],
    description: 'Horarios de toma en formato ISO 8601',
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  schedule!: string[];
}
