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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const luxon_1 = require("luxon");
const prisma_service_1 = require("../prisma/prisma.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    prisma;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateUpcomingEvents() {
        this.logger.log('Generating upcoming events...');
        const from = luxon_1.DateTime.utc().startOf('day');
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
            const candidates = [];
            for (const iso of med.schedule) {
                const dt = luxon_1.DateTime.fromISO(iso, { setZone: true }).toUTC();
                if (!dt.isValid || dt < from || dt >= to)
                    continue;
                candidates.push({ medicationId: med.id, userId: med.userId, dateTimeScheduled: dt.toJSDate() });
            }
            if (candidates.length === 0)
                continue;
            const existing = await this.prisma.medicationEvent.findMany({
                where: {
                    medicationId: med.id,
                    dateTimeScheduled: { gte: from.toJSDate(), lt: to.toJSDate() },
                },
                select: { dateTimeScheduled: true },
            });
            const existingSet = new Set(existing.map((e) => e.dateTimeScheduled.toISOString()));
            const toCreate = candidates.filter((c) => !existingSet.has(c.dateTimeScheduled.toISOString()));
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
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)('5 0 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "generateUpcomingEvents", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "markMissedEvents", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map