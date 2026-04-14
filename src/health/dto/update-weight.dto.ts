import { IsNumber } from 'class-validator';

export class UpdateWeightDto {
  @IsNumber()
  weight!: number;
}
