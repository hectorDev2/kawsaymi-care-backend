import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { HealthService } from './health.service';
import { UpdateWeightDto } from './dto/update-weight.dto';
import { UpdateHeightDto } from './dto/update-height.dto';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';

@ApiTags('Health')
@ApiBearerAuth()
@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({
    summary: 'Obtener perfil de salud — crea uno vacío si no existe',
  })
  @Get('profile')
  profile(@GetUser() user: User) {
    return this.healthService.profile(user.id);
  }

  @ApiOperation({
    summary:
      'Actualizar perfil de salud (peso/altura) — recalcula IMC cuando ambos existen',
  })
  @Put('profile')
  updateProfile(@GetUser() user: User, @Body() dto: UpdateHealthProfileDto) {
    return this.healthService.updateProfile(user.id, dto);
  }

  @ApiOperation({
    summary:
      'Registrar peso en kg — recalcula IMC automáticamente si hay talla',
  })
  @Post('weight')
  updateWeight(@GetUser() user: User, @Body() dto: UpdateWeightDto) {
    return this.healthService.updateWeight(user.id, dto.weight);
  }

  @ApiOperation({
    summary:
      'Registrar altura en cm — recalcula IMC automáticamente si hay peso',
  })
  @Post('height')
  updateHeight(@GetUser() user: User, @Body() dto: UpdateHeightDto) {
    return this.healthService.updateHeight(user.id, dto.height);
  }

  @ApiOperation({
    summary: 'Obtener IMC calculado — requiere tener peso y talla registrados',
  })
  @Get('imc')
  imc(@GetUser() user: User) {
    return this.healthService.imc(user.id);
  }

  @ApiOperation({
    summary:
      'Detectar polifarmacia — true si el usuario tiene 5 o más medicamentos activos',
  })
  @Get('polypharmacy')
  polypharmacy(@GetUser() user: User) {
    return this.healthService.polypharmacy(user.id);
  }
}
