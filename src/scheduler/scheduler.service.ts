import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Every day at 00:05 UTC — generate events for the next 30 days.
  @Cron('5 0 * * *')
  async generateUpcomingEvents() {
    this.logger.log('Generating upcoming events...');

    const from = DateTime.utc().startOf('day');
    const to = from.plus({ days: 30 });

    const meds = await this.prisma.medication.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lt: to.toJSDate() },
        OR: [{ endDate: null }, { endDate: { gte: from.toJSDate() } }],
      },
      select: { id: true, userId: true, schedule: true },
    });

    let created = 0;

    for (const med of meds) {
      const candidates: {
        medicationId: string;
        userId: string;
        dateTimeScheduled: Date;
      }[] = [];

      for (const iso of med.schedule) {
        const dt = DateTime.fromISO(iso, { setZone: true }).toUTC();
        if (!dt.isValid || dt < from || dt >= to) continue;
        candidates.push({
          medicationId: med.id,
          userId: med.userId,
          dateTimeScheduled: dt.toJSDate(),
        });
      }

      if (candidates.length === 0) continue;

      const existing = await this.prisma.medicationEvent.findMany({
        where: {
          medicationId: med.id,
          dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
        },
        select: { dateTimeScheduled: true },
      });
      const existingSet = new Set(
        existing.map((e) => e.dateTimeScheduled.toISOString()),
      );

      const toCreate = candidates.filter(
        (c) => !existingSet.has(c.dateTimeScheduled.toISOString()),
      );

      if (toCreate.length > 0) {
        const result = await this.prisma.medicationEvent.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        created += result.count;
      }
    }

    this.logger.log(`Generated ${created} new events.`);
  }

  // Every hour — mark PENDING events whose scheduled time has passed as MISSED.
  @Cron(CronExpression.EVERY_HOUR)
  async markMissedEvents() {
    const now = new Date();
    const result = await this.prisma.medicationEvent.updateMany({
      where: { status: 'PENDING', dateTimeScheduled: { lt: now } },
      data: { status: 'MISSED' },
    });

    if (result.count > 0) {
      this.logger.log(`Marked ${result.count} events as MISSED.`);
    }
  }
}
