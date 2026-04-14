"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const prisma_service_1 = require("../prisma/prisma.service");
let EventsService = class EventsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    toISOOrThrow(dt) {
        const iso = dt.toISO();
        if (!iso)
            throw new Error('Failed to serialize DateTime');
        return iso;
    }
    async today(userId) {
        const { from, to } = await this.getUserDayRange(userId);
        await this.ensureEventsForRange(userId, from, to);
        return this.list(userId, {
            from: this.toISOOrThrow(from),
            to: this.toISOOrThrow(to),
        });
    }
    async week(userId) {
        const { from, to } = await this.getUserWeekRange(userId);
        await this.ensureEventsForRange(userId, from, to);
        return this.list(userId, {
            from: this.toISOOrThrow(from),
            to: this.toISOOrThrow(to),
        });
    }
    async ensureRange(userId, fromISO, toISO) {
        const from = luxon_1.DateTime.fromISO(fromISO, { zone: 'utc' });
        const to = luxon_1.DateTime.fromISO(toISO, { zone: 'utc' });
        if (!from.isValid)
            throw new common_1.BadRequestException('Invalid from');
        if (!to.isValid)
            throw new common_1.BadRequestException('Invalid to');
        if (to <= from)
            throw new common_1.BadRequestException('Invalid range');
        await this.ensureEventsForRange(userId, from, to);
        return { success: true };
    }
    async list(userId, query) {
        const from = query.from
            ? luxon_1.DateTime.fromISO(query.from, { zone: 'utc' })
            : null;
        const to = query.to ? luxon_1.DateTime.fromISO(query.to, { zone: 'utc' }) : null;
        if (from && !from.isValid)
            throw new common_1.BadRequestException('Invalid from');
        if (to && !to.isValid)
            throw new common_1.BadRequestException('Invalid to');
        const status = query.status ? query.status : undefined;
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
    async mark(userId, id, status) {
        const event = await this.prisma.medicationEvent.findFirst({
            where: { id, userId },
        });
        if (!event)
            throw new common_1.NotFoundException('Event not found');
        const updated = await this.prisma.medicationEvent.update({
            where: { id },
            data: { status: status },
        });
        return { event: updated };
    }
    async getUserTimezone(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { timezone: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user.timezone || 'UTC';
    }
    async getUserDayRange(userId) {
        const tz = await this.getUserTimezone(userId);
        const now = luxon_1.DateTime.now().setZone(tz);
        const from = now.startOf('day').toUTC();
        const to = now.endOf('day').plus({ milliseconds: 1 }).toUTC();
        return { from, to };
    }
    async getUserWeekRange(userId) {
        const tz = await this.getUserTimezone(userId);
        const now = luxon_1.DateTime.now().setZone(tz);
        const from = now.startOf('week').toUTC();
        const to = now.endOf('week').plus({ milliseconds: 1 }).toUTC();
        return { from, to };
    }
    async ensureEventsForRange(userId, from, to) {
        const meds = await this.prisma.medication.findMany({
            where: {
                userId,
                status: 'ACTIVE',
                startDate: { lt: to.toJSDate() },
                OR: [{ endDate: null }, { endDate: { gte: from.toJSDate() } }],
            },
            select: { id: true, schedule: true, startDate: true, endDate: true },
        });
        const candidates = [];
        for (const med of meds) {
            for (const iso of med.schedule) {
                const dt = luxon_1.DateTime.fromISO(iso, { setZone: true }).toUTC();
                if (!dt.isValid)
                    continue;
                if (dt < from || dt >= to)
                    continue;
                candidates.push({
                    medicationId: med.id,
                    dateTimeScheduled: dt.toJSDate(),
                });
            }
        }
        if (candidates.length === 0)
            return;
        const existing = await this.prisma.medicationEvent.findMany({
            where: {
                userId,
                dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
            },
            select: { medicationId: true, dateTimeScheduled: true },
        });
        const existingKey = new Set(existing.map((e) => `${e.medicationId}::${e.dateTimeScheduled.toISOString()}`));
        const toCreate = candidates.filter((c) => !existingKey.has(`${c.medicationId}::${c.dateTimeScheduled.toISOString()}`));
        if (toCreate.length === 0)
            return;
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
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsService);
//# sourceMappingURL=events.service.js.map