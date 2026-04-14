import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMeDto {
  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '1990-05-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Buenos Aires, Argentina' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'es', description: 'Código de idioma ISO 639-1' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ example: 'America/Argentina/Buenos_Aires', description: 'Timezone IANA' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
