import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { UpdateMedicationStatusDto } from './dto/update-medication-status.dto';

@ApiTags('Medications')
@ApiBearerAuth()
@Controller('medications')
@UseGuards(JwtAuthGuard)
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @ApiOperation({ summary: 'Listar todos los medicamentos del usuario' })
  @Get()
  list(@GetUser() user: User) {
    return this.medicationsService.list(user.id);
  }

  @ApiOperation({ summary: 'Obtener detalle de un medicamento' })
  @Get(':id')
  get(@GetUser() user: User, @Param('id') id: string) {
    return this.medicationsService.get(user.id, id);
  }

  @ApiOperation({ summary: 'Crear medicamento — el campo schedule define los horarios de toma' })
  @Post()
  create(@GetUser() user: User, @Body() dto: CreateMedicationDto) {
    return this.medicationsService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar datos del medicamento' })
  @Put(':id')
  update(@GetUser() user: User, @Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    return this.medicationsService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Cambiar estado: ACTIVE | SUSPENDED | COMPLETED' })
  @Patch(':id/status')
  updateStatus(@GetUser() user: User, @Param('id') id: string, @Body() dto: UpdateMedicationStatusDto) {
    return this.medicationsService.updateStatus(user.id, id, dto.status);
  }

  @ApiOperation({ summary: 'Eliminar medicamento y sus eventos asociados' })
  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.medicationsService.remove(user.id, id);
  }
}
