import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { user };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        location: dto.location,
        language: dto.language,
        timezone: dto.timezone,
      },
    });
    return { user };
  }

  async updateAllergies(userId: string, allergies: string[]) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { allergies },
    });
    return { user };
  }

  async updateConditions(userId: string, conditions: string[]) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { conditions },
    });
    return { user };
  }

  async deleteMe(userId: string) {
    // Cascade deletes are handled by DB foreign keys.
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }
}
