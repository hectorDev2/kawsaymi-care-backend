import { IsEnum } from 'class-validator';
import { MedStatus } from '@prisma/client';

export class UpdateMedicationStatusDto {
  @IsEnum(MedStatus)
  status!: MedStatus;
}
