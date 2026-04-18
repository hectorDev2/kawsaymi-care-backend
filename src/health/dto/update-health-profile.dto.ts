import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateHealthProfileDto {
  @ApiPropertyOptional({ example: 70.5, description: 'Peso en kilogramos' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  weight?: number;

  @ApiPropertyOptional({ example: 170, description: 'Altura en centimetros' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;
}
