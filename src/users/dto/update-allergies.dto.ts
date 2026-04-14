import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateAllergiesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  allergies!: string[];
}
