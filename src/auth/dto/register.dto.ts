import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

const REGISTER_ROLES = [Role.PATIENT, Role.CAREGIVER] as const;

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: REGISTER_ROLES, example: Role.PATIENT })
  @IsIn(REGISTER_ROLES)
  role: Role;
}
