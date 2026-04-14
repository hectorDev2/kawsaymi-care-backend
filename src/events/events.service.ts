import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { EventsRangeQueryDto } from './dto/events-range-query.dto';

type MarkStatus = 'TAKEN' | 'MISSED';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private toISOOrThrow(dt: DateTime) {
    const iso = dt.toISO();
    if (!iso) throw new Error('Failed to serialize DateTime');
    return iso;
  }

  async today(userId: string) {
    const { from, to } = await this.getUserDayRange(userId);
    await this.ensureEventsForRange(userId, from, to);
    return this.list(userId, {
      from: this.toISOOrThrow(from),
      to: this.toISOOrThrow(to),
    });
  }

  async week(userId: string) {
    const { from, to } = await this.getUserWeekRange(userId);
    await this.ensureEventsForRange(userId, from, to);
    return this.list(userId, {
      from: this.toISOOrThrow(from),
      to: this.toISOOrThrow(to),
    });
  }

  async ensureRange(userId: string, fromISO: string, toISO: string) {
    const from = DateTime.fromISO(fromISO, { zone: 'utc' });
    const to = DateTime.fromISO(toISO, { zone: 'utc' });
    if (!from.isValid) throw new BadRequestException('Invalid from');
    if (!to.isValid) throw new BadRequestException('Invalid to');
    if (to <= from) throw new BadRequestException('Invalid range');
    await this.ensureEventsForRange(userId, from, to);
    return { success: true };
  }

  async list(userId: string, query: EventsRangeQueryDto) {
    const from = query.from
      ? DateTime.fromISO(query.from, { zone: 'utc' })
      : null;
    const to = query.to ? DateTime.fromISO(query.to, { zone: 'utc' }) : null;
    if (from && !from.isValid) throw new BadRequestException('Invalid from');
    if (to && !to.isValid) throw new BadRequestException('Invalid to');

    const status = query.status ? (query.status as EventStatus) : undefined;

    const events = await this.prisma.medicationEvent.findMany({
      where: {
        userId,
        medicationId: query.medicationId,
        status,
        dateTimeScheduled: {
          gte: from ? from.toJSDate() : undefined,
          lt: to ? to.toJSDate() : undefined,
        },
      },
      orderBy: { dateTimeScheduled: 'asc' },
    });

    return { events };
  }

  async mark(userId: string, id: string, status: MarkStatus) {
    const event = await this.prisma.medicationEvent.findFirst({
      where: { id, userId },
    });
    if (!event) throw new NotFoundException('Event not found');

    const updated = await this.prisma.medicationEvent.update({
      where: { id },
      data: { status: status as EventStatus },
    });
    return { event: updated };
  }

  private async getUserTimezone(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user.timezone || 'UTC';
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

  private async ensureEventsForRange(
    userId: string,
    from: DateTime,
    to: DateTime,
  ) {
    // ISO datetimes stored in Medication.schedule.
    // We materialize events that fall inside [from, to) and don't exist yet.
    const meds = await this.prisma.medication.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        startDate: { lt: to.toJSDate() },
        OR: [{ endDate: null }, { endDate: { gte: from.toJSDate() } }],
      },
      select: { id: true, schedule: true, startDate: true, endDate: true },
    });

    const candidates: { medicationId: string; dateTimeScheduled: Date }[] = [];
    for (const med of meds) {
      for (const iso of med.schedule) {
        const dt = DateTime.fromISO(iso, { setZone: true }).toUTC();
        if (!dt.isValid) continue;
        if (dt < from || dt >= to) continue;
        candidates.push({
          medicationId: med.id,
          dateTimeScheduled: dt.toJSDate(),
        });
      }
    }

    if (candidates.length === 0) return;

    // Create missing events idempotently by checking existing pairs.
    const existing = await this.prisma.medicationEvent.findMany({
      where: {
        userId,
        dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
      },
      select: { medicationId: true, dateTimeScheduled: true },
    });
    const existingKey = new Set(
      existing.map(
        (e) => `${e.medicationId}::${e.dateTimeScheduled.toISOString()}`,
      ),
    );

    const toCreate = candidates.filter(
      (c) =>
        !existingKey.has(
          `${c.medicationId}::${c.dateTimeScheduled.toISOString()}`,
        ),
    );
    if (toCreate.length === 0) return;

    await this.prisma.medicationEvent.createMany({
      data: toCreate.map((c) => ({
        userId,
        medicationId: c.medicationId,
        dateTimeScheduled: c.dateTimeScheduled,
        status: 'PENDING',
      })),
      skipDuplicates: true,
    });
  }
}
