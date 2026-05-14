import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MedStatus } from '@prisma/client';

export class UpdateMedicationStatusDto {
  @ApiProperty({ enum: MedStatus, example: MedStatus.SUSPENDED })
  @IsEnum(MedStatus)
  status!: MedStatus;
}
