import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CaregiversService } from './caregivers.service';
import { InviteCaregiverDto } from './dto/invite-caregiver.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@ApiTags('Caregivers')
@ApiBearerAuth()
@Controller('caregivers')
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @ApiOperation({
    summary:
      'Invitar cuidador por email — el cuidador debe estar registrado en la app',
  })
  @ApiResponse({ status: 201, description: 'Invitación enviada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 404,
    description: 'Cuidador no encontrado por ese email',
  })
  @Post('invite')
  invite(@GetUser() user: User, @Body() dto: InviteCaregiverDto) {
    return this.caregiversService.invite(user.id, dto);
  }

  @ApiOperation({ summary: 'Listar mis pacientes (para cuidadores)' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('my-patients')
  myPatients(@GetUser() user: User) {
    return this.caregiversService.myPatients(user.id);
  }

  @ApiOperation({ summary: 'Listar mis cuidadores (para pacientes)' })
  @ApiResponse({ status: 200, description: 'Lista de cuidadores' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('my-caregivers')
  myCaregivers(@GetUser() user: User) {
    return this.caregiversService.myCaregivers(user.id);
  }

  @ApiOperation({
    summary:
      'Actualizar permisos de una relación — solo el paciente puede hacerlo',
  })
  @ApiResponse({
    status: 200,
    description: 'Permisos actualizados',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Solo el paciente puede modificar permisos',
  })
  @ApiResponse({ status: 404, description: 'Relación no encontrada' })
  @Patch(':id/permissions')
  updatePermissions(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.caregiversService.updatePermissions(
      user.id,
      id,
      dto.permissions,
    );
  }

  @ApiOperation({
    summary:
      'Eliminar relación cuidador-paciente — cualquiera de los dos puede hacerlo',
  })
  @ApiResponse({ status: 200, description: 'Relación eliminada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Relación no encontrada' })
  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.caregiversService.remove(user.id, id);
  }

  @ApiOperation({
    summary:
      'Ver alertas del paciente — eventos omitidos en los últimos 7 días',
  })
  @ApiResponse({ status: 200, description: 'Alertas del paciente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Relación o paciente no encontrado' })
  @Get(':patientId/alerts')
  alerts(@GetUser() user: User, @Param('patientId') patientId: string) {
    return this.caregiversService.patientAlerts(user.id, patientId);
  }
}
