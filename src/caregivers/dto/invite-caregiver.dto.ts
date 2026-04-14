import { IsArray, IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteCaregiverDto {
  @ApiProperty({ example: 'cuidador@email.com' })
  @IsEmail()
  caregiverEmail: string;

  @ApiProperty({
    example: ['read', 'notify'],
    description: 'Permisos: read (ver medicamentos), notify (recibir alertas)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
