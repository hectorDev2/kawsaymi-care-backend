import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CaregiversService } from './caregivers.service';
import { InviteCaregiverDto } from './dto/invite-caregiver.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@ApiTags('Caregivers')
@ApiBearerAuth()
@Controller('caregivers')
@UseGuards(JwtAuthGuard)
export class CaregiversController {
  constructor(private readonly caregiversService: CaregiversService) {}

  @ApiOperation({ summary: 'Invitar cuidador por email — el cuidador debe estar registrado en la app' })
  @Post('invite')
  invite(@GetUser() user: User, @Body() dto: InviteCaregiverDto) {
    return this.caregiversService.invite(user.id, dto);
  }

  @ApiOperation({ summary: 'Listar mis pacientes (para cuidadores)' })
  @Get('my-patients')
  myPatients(@GetUser() user: User) {
    return this.caregiversService.myPatients(user.id);
  }

  @ApiOperation({ summary: 'Listar mis cuidadores (para pacientes)' })
  @Get('my-caregivers')
  myCaregivers(@GetUser() user: User) {
    return this.caregiversService.myCaregivers(user.id);
  }

  @ApiOperation({ summary: 'Actualizar permisos de una relación — solo el paciente puede hacerlo' })
  @Patch(':id/permissions')
  updatePermissions(@GetUser() user: User, @Param('id') id: string, @Body() dto: UpdatePermissionsDto) {
    return this.caregiversService.updatePermissions(user.id, id, dto.permissions);
  }

  @ApiOperation({ summary: 'Eliminar relación cuidador-paciente — cualquiera de los dos puede hacerlo' })
  @Delete(':id')
  remove(@GetUser() user: User, @Param('id') id: string) {
    return this.caregiversService.remove(user.id, id);
  }

  @ApiOperation({ summary: 'Ver alertas del paciente — eventos omitidos en los últimos 7 días' })
  @Get(':patientId/alerts')
  alerts(@GetUser() user: User, @Param('patientId') patientId: string) {
    return this.caregiversService.patientAlerts(user.id, patientId);
  }
}
