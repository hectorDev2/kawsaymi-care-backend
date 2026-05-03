import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHealthProfileDto } from './dto/update-health-profile.dto';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(userId: string) {
    const health = await this.prisma.healthData.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return { health };
  }

  async updateWeight(userId: string, weight: number) {
    const existing = await this.prisma.healthData.findUnique({
      where: { userId },
    });
    const imc = this.calculateImc(weight, existing?.height ?? null);

    const health = await this.prisma.healthData.upsert({
      where: { userId },
      update: { weight, imc },
      create: { userId, weight, imc },
    });

    return { health };
  }

  async updateHeight(userId: string, height: number) {
    const existing = await this.prisma.healthData.findUnique({
      where: { userId },
    });
    const imc = this.calculateImc(existing?.weight ?? null, height);

    const health = await this.prisma.healthData.upsert({
      where: { userId },
      update: { height, imc },
      create: { userId, height, imc },
    });

    return { health };
  }

  async updateProfile(userId: string, dto: UpdateHealthProfileDto) {
    const existing = await this.prisma.healthData.findUnique({
      where: { userId },
    });

    const weight = dto.weight ?? existing?.weight ?? null;
    const height = dto.height ?? existing?.height ?? null;
    const imc = this.calculateImc(weight, height);

    const health = await this.prisma.healthData.upsert({
      where: { userId },
      update: {
        weight: dto.weight,
        height: dto.height,
        imc,
      },
      create: {
        userId,
        weight: dto.weight,
        height: dto.height,
        imc,
      },
    });

    return { health };
  }

  async imc(userId: string) {
    const health = await this.prisma.healthData.findUnique({
      where: { userId },
    });

    const imc = this.calculateImc(
      health?.weight ?? null,
      health?.height ?? null,
    );
    return { imc };
  }

  async polypharmacy(userId: string) {
    const activeMedications = await this.prisma.medication.count({
      where: { userId, status: 'ACTIVE' },
    });

    return {
      activeMedications,
      polypharmacy: activeMedications >= 5,
    };
  }

  private calculateImc(weight: number | null, height: number | null) {
    if (!weight || !height) return null;
    if (height <= 0) return null;
    // Frontend contract uses height in centimeters.
    const heightM = height / 100;
    if (heightM <= 0) return null;
    return weight / (heightM * heightM);
  }
}
