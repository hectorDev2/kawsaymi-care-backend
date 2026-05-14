import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateAllergiesDto } from './dto/update-allergies.dto';
import { UpdateConditionsDto } from './dto/update-conditions.dto';
import { UpdateMedicalBackgroundDto } from './dto/update-medical-background.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Get('me')
  me(@GetUser() user: User) {
    return this.usersService.getMe(user.id);
  }

  @ApiOperation({
    summary:
      'Actualizar nombre, fecha de nacimiento, ubicación, idioma y timezone',
  })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Put('me')
  updateMe(@GetUser() user: User, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar lista de alergias' })
  @ApiResponse({ status: 200, description: 'Alergias actualizadas' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Put('me/allergies')
  updateAllergies(@GetUser() user: User, @Body() dto: UpdateAllergiesDto) {
    return this.usersService.updateAllergies(user.id, dto.allergies);
  }

  @ApiOperation({ summary: 'Actualizar condiciones médicas' })
  @ApiResponse({ status: 200, description: 'Condiciones actualizadas' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Put('me/conditions')
  updateConditions(@GetUser() user: User, @Body() dto: UpdateConditionsDto) {
    return this.usersService.updateConditions(user.id, dto.conditions);
  }

  @ApiOperation({ summary: 'Actualizar antecedentes médicos completos' })
  @ApiResponse({ status: 200, description: 'Antecedentes actualizados' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Put('me/medical-background')
  updateMedicalBackground(
    @GetUser() user: User,
    @Body() dto: UpdateMedicalBackgroundDto,
  ) {
    return this.usersService.updateMedicalBackground(user.id, dto);
  }

  @ApiOperation({ summary: 'Eliminar cuenta y todos los datos asociados' })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @Delete('me')
  deleteMe(@GetUser() user: User) {
    return this.usersService.deleteMe(user.id);
  }
}
