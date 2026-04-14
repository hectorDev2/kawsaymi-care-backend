import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const health = await this.prisma.healthData.upsert({
      where: { userId },
      update: { weight },
      create: { userId, weight },
    });

    const imc = this.calculateImc(health.weight, health.height);
    const updated = await this.prisma.healthData.update({
      where: { userId },
      data: { imc },
    });

    return { health: updated };
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
    return weight / (height * height);
  }
}
