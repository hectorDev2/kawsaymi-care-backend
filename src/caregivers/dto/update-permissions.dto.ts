import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionsDto {
  @ApiProperty({
    example: ['read', 'notify'],
    description: 'Permisos: read (ver medicamentos), notify (recibir alertas)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
