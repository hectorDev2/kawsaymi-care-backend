import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class KnowledgeAnswerDto {
  @ApiProperty({
    example: '¿Cuál es el manejo inicial de hipertensión según la guía?',
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Top K chunks a recuperar (default 6, max 20)',
    example: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  k?: number;

  @ApiPropertyOptional({
    description: 'Minimum cosine similarity score (default 0.80)',
    example: 0.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  scoreMin?: number;

  @ApiPropertyOptional({
    description: 'If true, include raw matches for debugging (default false)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }): unknown => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'true') return true;
      if (value.toLowerCase() === 'false') return false;
    }
    return value as unknown;
  })
  debug?: boolean;
}
