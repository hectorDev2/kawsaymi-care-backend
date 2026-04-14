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
exports.CaregiversService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CaregiversService = class CaregiversService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async invite(patientId, dto) {
        const caregiver = await this.prisma.user.findUnique({
            where: { email: dto.caregiverEmail },
        });
        if (!caregiver)
            throw new common_1.NotFoundException('Caregiver user not found');
        const existing = await this.prisma.caregiverRelation.findUnique({
            where: { patientId_caregiverId: { patientId, caregiverId: caregiver.id } },
        });
        if (existing)
            throw new common_1.ConflictException('Relation already exists');
        const relation = await this.prisma.caregiverRelation.create({
            data: { patientId, caregiverId: caregiver.id, permissions: dto.permissions },
            include: { caregiver: true },
        });
        return { relation };
    }
    async myPatients(caregiverId) {
        const relations = await this.prisma.caregiverRelation.findMany({
            where: { caregiverId },
            include: { patient: true },
        });
        return { relations };
    }
    async myCaregivers(patientId) {
        const relations = await this.prisma.caregiverRelation.findMany({
            where: { patientId },
            include: { caregiver: true },
        });
        return { relations };
    }
    async updatePermissions(userId, relationId, permissions) {
        const relation = await this.prisma.caregiverRelation.findUnique({
            where: { id: relationId },
        });
        if (!relation)
            throw new common_1.NotFoundException('Relation not found');
        if (relation.patientId !== userId)
            throw new common_1.ForbiddenException();
        const updated = await this.prisma.caregiverRelation.update({
            where: { id: relationId },
            data: { permissions },
        });
        return { relation: updated };
    }
    async remove(userId, relationId) {
        const relation = await this.prisma.caregiverRelation.findUnique({
            where: { id: relationId },
        });
        if (!relation)
            throw new common_1.NotFoundException('Relation not found');
        if (relation.patientId !== userId && relation.caregiverId !== userId) {
            throw new common_1.ForbiddenException();
        }
        await this.prisma.caregiverRelation.delete({ where: { id: relationId } });
        return { success: true };
    }
    async patientAlerts(caregiverId, patientId) {
        const relation = await this.prisma.caregiverRelation.findUnique({
            where: { patientId_caregiverId: { patientId, caregiverId } },
        });
        if (!relation)
            throw new common_1.ForbiddenException('No access to this patient');
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
};
exports.CaregiversService = CaregiversService;
exports.CaregiversService = CaregiversService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CaregiversService);
//# sourceMappingURL=caregivers.service.js.map