import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateAllergiesDto } from './dto/update-allergies.dto';
import { UpdateConditionsDto } from './dto/update-conditions.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @Get('me')
  me(@GetUser() user: User) {
    return this.usersService.getMe(user.id);
  }

  @ApiOperation({
    summary:
      'Actualizar nombre, fecha de nacimiento, ubicación, idioma y timezone',
  })
  @Put('me')
  updateMe(@GetUser() user: User, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @ApiOperation({ summary: 'Actualizar lista de alergias' })
  @Put('me/allergies')
  updateAllergies(@GetUser() user: User, @Body() dto: UpdateAllergiesDto) {
    return this.usersService.updateAllergies(user.id, dto.allergies);
  }

  @ApiOperation({ summary: 'Actualizar condiciones médicas' })
  @Put('me/conditions')
  updateConditions(@GetUser() user: User, @Body() dto: UpdateConditionsDto) {
    return this.usersService.updateConditions(user.id, dto.conditions);
  }

  @ApiOperation({ summary: 'Eliminar cuenta y todos los datos asociados' })
  @Delete('me')
  deleteMe(@GetUser() user: User) {
    return this.usersService.deleteMe(user.id);
  }
}
