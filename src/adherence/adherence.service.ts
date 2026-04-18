import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class AdherenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async today(userId: string) {
    await this.eventsService.today(userId);
    const { from, to } = await this.getUserDayRange(userId);
    return this.summarize(userId, from, to);
  }

  async week(userId: string) {
    await this.eventsService.week(userId);
    const { from, to } = await this.getUserWeekRange(userId);
    return this.summarize(userId, from, to);
  }

  async month(userId: string) {
    const tz = await this.getUserTimezone(userId);
    const now = DateTime.now().setZone(tz);
    const from = now.startOf('month').toUTC();
    const to = now.endOf('month').plus({ milliseconds: 1 }).toUTC();
    const fromISO = from.toISO();
    const toISO = to.toISO();
    if (!fromISO || !toISO) throw new Error('Failed to serialize month range');
    await this.eventsService.ensureRange(userId, fromISO, toISO);
    return this.summarize(userId, from, to);
  }

  async stats(userId: string) {
    const { from, to } = await this.getUserWeekRange(userId);
    return this.summarize(userId, from, to);
  }

  private async summarize(userId: string, from: DateTime, to: DateTime) {
    const [taken, missed, pending, activeMedications] = await Promise.all([
      this.prisma.medicationEvent.count({
        where: {
          userId,
          status: 'TAKEN',
          dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
        },
      }),
      this.prisma.medicationEvent.count({
        where: {
          userId,
          status: 'MISSED',
          dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
        },
      }),
      this.prisma.medicationEvent.count({
        where: {
          userId,
          status: 'PENDING',
          dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
        },
      }),
      this.prisma.medication.count({ where: { userId, status: 'ACTIVE' } }),
    ]);

    const total = taken + missed + pending;
    const adherenceRate = total === 0 ? 0 : taken / total;

    return { taken, missed, pending, total, adherenceRate, activeMedications };
  }

  private async getUserTimezone(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    return user?.timezone || 'UTC';
  }

  private async getUserDayRange(userId: string) {
    const tz = await this.getUserTimezone(userId);
    const now = DateTime.now().setZone(tz);
    const from = now.startOf('day').toUTC();
    const to = now.endOf('day').plus({ milliseconds: 1 }).toUTC();
    return { from, to };
  }

  private async getUserWeekRange(userId: string) {
    const tz = await this.getUserTimezone(userId);
    const now = DateTime.now().setZone(tz);
    const from = now.startOf('week').toUTC();
    const to = now.endOf('week').plus({ milliseconds: 1 }).toUTC();
    return { from, to };
  }
}
