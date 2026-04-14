import { Injectable, NotFoundException } from '@nestjs/common';
import { MedStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';

@Injectable()
export class MedicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const medications = await this.prisma.medication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { medications };
  }

  async get(userId: string, id: string) {
    const medication = await this.prisma.medication.findFirst({
      where: { id, userId },
    });
    if (!medication) throw new NotFoundException('Medication not found');
    return { medication };
  }

  async create(userId: string, dto: CreateMedicationDto) {
    const medication = await this.prisma.medication.create({
      data: {
        userId,
        name: dto.name,
        dose: dto.dose,
        frequency: dto.frequency,
        intervalHours: dto.intervalHours,
        instructions: dto.instructions,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        schedule: dto.schedule,
      },
    });
    return { medication };
  }

  async update(userId: string, id: string, dto: UpdateMedicationDto) {
    // Ensure ownership and existence.
    await this.get(userId, id);

    const medication = await this.prisma.medication.update({
      where: { id },
      data: {
        name: dto.name,
        dose: dto.dose,
        frequency: dto.frequency,
        intervalHours: dto.intervalHours,
        instructions: dto.instructions,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        schedule: dto.schedule,
      },
    });
    return { medication };
  }

  async updateStatus(userId: string, id: string, status: MedStatus) {
    await this.get(userId, id);
    const medication = await this.prisma.medication.update({
      where: { id },
      data: { status },
    });
    return { medication };
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.medication.delete({ where: { id } });
    return { success: true };
  }
}
