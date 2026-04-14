import { Body, Controller, Delete, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateAllergiesDto } from './dto/update-allergies.dto';
import { UpdateConditionsDto } from './dto/update-conditions.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@GetUser() user: User) {
    return this.usersService.getMe(user.id);
  }

  @Put('me')
  updateMe(@GetUser() user: User, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Put('me/allergies')
  updateAllergies(@GetUser() user: User, @Body() dto: UpdateAllergiesDto) {
    return this.usersService.updateAllergies(user.id, dto.allergies);
  }

  @Put('me/conditions')
  updateConditions(@GetUser() user: User, @Body() dto: UpdateConditionsDto) {
    return this.usersService.updateConditions(user.id, dto.conditions);
  }

  @Delete('me')
  deleteMe(@GetUser() user: User) {
    return this.usersService.deleteMe(user.id);
  }
}
