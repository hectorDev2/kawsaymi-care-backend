import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { UpdateMedicationStatusDto } from './dto/update-medication-status.dto';

@ApiTags('Medications')
@ApiBearerAuth()
@Controller('medications')
export class MedicationsController {
  constructor(private readonly medicationsService: MedicationsService) {}

  @ApiOperation({ summary: 'Listar todos los medicamentos del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de medicamentos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get()
  list(@GetUser() user: User) {
    return this.medicationsService.list(user.id);
  }

  @ApiOperation({ summary: 'Obtener detalle de un medicamento' })
  @ApiResponse({ status: 200, description: 'Detalle del medicamento' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @Get(':id')
  get(@GetUser() user: User, @Param('id') id: string) {
    return this.medicationsService.get(user.id, id);
  }

  @ApiOperation({
    summary:
      'Crear medicamento — el campo schedule define los horarios de toma',
  })
  @ApiResponse({ status: 201, description: 'Medicamento creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Post()
  create(@GetUser() user: User, @Body() dto: CreateMedicationDto) {
    return this.medicationsService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar datos del medicamento' })
  @ApiResponse({ status: 200, description: 'Medicamento actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @Put(':id')
  update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationDto,
  ) {
    return this.medicationsService.update(user.id, id, dto);
  }

  @ApiOperation({ summary: 'Cambiar estado: ACTIVE | SUSPENDED | COMPLETED' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @Patch(':id/status')
  updateStatus(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateMedicationStatusDto,
  ) {
    return this.medicationsService.updateStatus(user.id, id, dto.status);
  }

  @ApiOperation({ summary: 'Eliminar medicamento y sus eventos asociados' })
  @ApiResponse({ status: 200, description: 'Medicamento eliminado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Medicamento no encontrado' })
  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.medicationsService.remove(user.id, id);
  }
}
