import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateWeightDto {
  @ApiProperty({ example: 75.5, description: 'Peso en kilogramos' })
  @IsNumber()
  @Min(1)
  weight!: number;
}
