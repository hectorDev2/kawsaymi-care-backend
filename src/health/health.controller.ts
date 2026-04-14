import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { HealthService } from './health.service';
import { UpdateWeightDto } from './dto/update-weight.dto';

@Controller('health')
@UseGuards(JwtAuthGuard)
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('profile')
  profile(@GetUser() user: User) {
    return this.healthService.profile(user.id);
  }

  @Post('weight')
  updateWeight(@GetUser() user: User, @Body() dto: UpdateWeightDto) {
    return this.healthService.updateWeight(user.id, dto.weight);
  }

  @Get('imc')
  imc(@GetUser() user: User) {
    return this.healthService.imc(user.id);
  }

  @Get('polypharmacy')
  polypharmacy(@GetUser() user: User) {
    return this.healthService.polypharmacy(user.id);
  }
}
