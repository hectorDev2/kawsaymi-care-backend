import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class UpdateConditionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  conditions!: string[];
}
