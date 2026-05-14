import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConditionsDto {
  @ApiProperty({ example: ['Hipertensión', 'Diabetes tipo 2'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  conditions!: string[];
}
