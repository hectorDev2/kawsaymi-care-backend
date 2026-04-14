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
exports.AdherenceService = void 0;
const common_1 = require("@nestjs/common");
const luxon_1 = require("luxon");
const prisma_service_1 = require("../prisma/prisma.service");
const events_service_1 = require("../events/events.service");
let AdherenceService = class AdherenceService {
    prisma;
    eventsService;
    constructor(prisma, eventsService) {
        this.prisma = prisma;
        this.eventsService = eventsService;
    }
    async today(userId) {
        await this.eventsService.today(userId);
        const { from, to } = await this.getUserDayRange(userId);
        return this.summarize(userId, from, to);
    }
    async week(userId) {
        await this.eventsService.week(userId);
        const { from, to } = await this.getUserWeekRange(userId);
        return this.summarize(userId, from, to);
    }
    async month(userId) {
        const tz = await this.getUserTimezone(userId);
        const now = luxon_1.DateTime.now().setZone(tz);
        const from = now.startOf('month').toUTC();
        const to = now.endOf('month').plus({ milliseconds: 1 }).toUTC();
        const fromISO = from.toISO();
        const toISO = to.toISO();
        if (!fromISO || !toISO)
            throw new Error('Failed to serialize month range');
        await this.eventsService.ensureRange(userId, fromISO, toISO);
        return this.summarize(userId, from, to);
    }
    async stats(userId) {
        const { from, to } = await this.getUserWeekRange(userId);
        const summary = await this.summarize(userId, from, to);
        const activeMedications = await this.prisma.medication.count({
            where: { userId, status: 'ACTIVE' },
        });
        return { ...summary, activeMedications };
    }
    async summarize(userId, from, to) {
        const [taken, missed, pending] = await Promise.all([
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
        ]);
        const total = taken + missed + pending;
        const adherenceRate = total === 0 ? 0 : taken / total;
        return { taken, missed, pending, total, adherenceRate };
    }
    async getUserTimezone(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { timezone: true },
        });
        return user?.timezone || 'UTC';
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
};
exports.AdherenceService = AdherenceService;
exports.AdherenceService = AdherenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_service_1.EventsService])
], AdherenceService);
//# sourceMappingURL=adherence.service.js.map