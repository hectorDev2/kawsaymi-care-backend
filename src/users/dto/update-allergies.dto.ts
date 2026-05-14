import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAllergiesDto {
  @ApiProperty({ example: ['Penicilina', 'Polen'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  allergies!: string[];
}
