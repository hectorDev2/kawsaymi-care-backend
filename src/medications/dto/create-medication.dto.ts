import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMedicationDto {
  @IsString()
  name!: string;

  @IsString()
  dose!: string;

  @IsInt()
  @Min(1)
  frequency!: number;

  @IsInt()
  @Min(1)
  intervalHours!: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  schedule!: string[];
}
