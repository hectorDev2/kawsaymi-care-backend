import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateHeightDto {
  @ApiProperty({ example: 170, description: 'Altura en centimetros' })
  @IsNumber()
  @Min(1)
  height!: number;
}
