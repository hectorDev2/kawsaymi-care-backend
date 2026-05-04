import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';

export class UpdateMedicalBackgroundDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bloodType?: string;

  @ApiProperty({ example: ['Hipertensión', 'Diabetes'] })
  @IsArray()
  @IsString({ each: true })
  conditions: string[];

  @ApiProperty({ example: ['Penicilina'] })
  @IsArray()
  @IsString({ each: true })
  allergies: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  surgeries?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hospitalizations?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  transfusions?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vaccines?: string;
}