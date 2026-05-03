import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class KnowledgeSuggestionDto {
  @ApiProperty({ example: '¿Cómo se toma el paracetamol inyectable?' })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Top K chunks (default 3, max 10)',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  k?: number;

  @ApiPropertyOptional({
    description: 'Min similarity score (default 0.75)',
    example: 0.75,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  scoreMin?: number;
}
