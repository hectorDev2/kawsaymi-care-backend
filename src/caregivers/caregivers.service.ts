import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteCaregiverDto } from './dto/invite-caregiver.dto';

@Injectable()
export class CaregiversService {
  constructor(private readonly prisma: PrismaService) {}

  async invite(patientId: string, dto: InviteCaregiverDto) {
    const caregiver = await this.prisma.user.findUnique({
      where: { email: dto.caregiverEmail },
    });
    if (!caregiver) throw new NotFoundException('Caregiver user not found');

    const existing = await this.prisma.caregiverRelation.findUnique({
      where: {
        patientId_caregiverId: { patientId, caregiverId: caregiver.id },
      },
    });
    if (existing) throw new ConflictException('Relation already exists');

    const relation = await this.prisma.caregiverRelation.create({
      data: {
        patientId,
        caregiverId: caregiver.id,
        permissions: dto.permissions,
      },
      include: { caregiver: true },
    });
    return { relation };
  }

  async myPatients(caregiverId: string) {
    const relations = await this.prisma.caregiverRelation.findMany({
      where: { caregiverId },
      include: { patient: true },
    });
    return { relations };
  }

  async myCaregivers(patientId: string) {
    const relations = await this.prisma.caregiverRelation.findMany({
      where: { patientId },
      include: { caregiver: true },
    });
    return { relations };
  }

  async updatePermissions(
    userId: string,
    relationId: string,
    permissions: string[],
  ) {
    const relation = await this.prisma.caregiverRelation.findUnique({
      where: { id: relationId },
    });
    if (!relation) throw new NotFoundException('Relation not found');
    if (relation.patientId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.caregiverRelation.update({
      where: { id: relationId },
      data: { permissions },
    });
    return { relation: updated };
  }

  async remove(userId: string, relationId: string) {
    const relation = await this.prisma.caregiverRelation.findUnique({
      where: { id: relationId },
    });
    if (!relation) throw new NotFoundException('Relation not found');
    if (relation.patientId !== userId && relation.caregiverId !== userId) {
      throw new ForbiddenException();
    }

    await this.prisma.caregiverRelation.delete({ where: { id: relationId } });
    return { success: true };
  }

  async patientAlerts(caregiverId: string, patientId: string) {
    // Verify caregiver has access to this patient.
    const relation = await this.prisma.caregiverRelation.findUnique({
      where: { patientId_caregiverId: { patientId, caregiverId } },
    });
    if (!relation) throw new ForbiddenException('No access to this patient');

    // Missed events in the last 7 days.
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const missedEvents = await this.prisma.medicationEvent.findMany({
      where: {
        userId: patientId,
        status: 'MISSED',
        dateTimeScheduled: { gte: since },
      },
      include: { medication: true },
      orderBy: { dateTimeScheduled: 'desc' },
    });

    const total = await this.prisma.medicationEvent.count({
      where: { userId: patientId, dateTimeScheduled: { gte: since } },
    });

    const adherenceRate = total === 0 ? 0 : 1 - missedEvents.length / total;

    return {
      missedEvents,
      adherenceRate,
      lowAdherence: adherenceRate < 0.6,
    };
  }
}
