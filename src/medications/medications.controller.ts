import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { UpdateMedicationStatusDto } from './dto/update-medication-status.dto';

@Controller('medications')
@UseGuards(JwtAuthGuard)
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @Get()
  list(@GetUser() user: User) {
    return this.medicationsService.list(user.id);
  }

  @Get(':id')
  get(@GetUser() user: User, @Param('id') id: string) {
    return this.medicationsService.get(user.id, id);
  }

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateMedicationDto) {
    return this.medicationsService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medicationsService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationStatusDto,
  ) {
    return this.medicationsService.updateStatus(user.id, id, dto.status);
  }

  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.medicationsService.remove(user.id, id);
  }
}
