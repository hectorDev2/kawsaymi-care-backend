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
exports.MedicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let MedicationsService = class MedicationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(userId) {
        const medications = await this.prisma.medication.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return { medications };
    }
    async get(userId, id) {
        const medication = await this.prisma.medication.findFirst({
            where: { id, userId },
        });
        if (!medication)
            throw new common_1.NotFoundException('Medication not found');
        return { medication };
    }
    async create(userId, dto) {
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
    async update(userId, id, dto) {
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
    async updateStatus(userId, id, status) {
        await this.get(userId, id);
        const medication = await this.prisma.medication.update({
            where: { id },
            data: { status },
        });
        return { medication };
    }
    async remove(userId, id) {
        await this.get(userId, id);
        await this.prisma.medication.delete({ where: { id } });
        return { success: true };
    }
};
exports.MedicationsService = MedicationsService;
exports.MedicationsService = MedicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MedicationsService);
//# sourceMappingURL=medications.service.js.map