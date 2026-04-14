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
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HealthService = class HealthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async profile(userId) {
        const health = await this.prisma.healthData.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });
        return { health };
    }
    async updateWeight(userId, weight) {
        const existing = await this.prisma.healthData.findUnique({ where: { userId } });
        const imc = this.calculateImc(weight, existing?.height ?? null);
        const health = await this.prisma.healthData.upsert({
            where: { userId },
            update: { weight, imc },
            create: { userId, weight, imc },
        });
        return { health };
    }
    async imc(userId) {
        const health = await this.prisma.healthData.findUnique({
            where: { userId },
        });
        const imc = this.calculateImc(health?.weight ?? null, health?.height ?? null);
        return { imc };
    }
    async polypharmacy(userId) {
        const activeMedications = await this.prisma.medication.count({
            where: { userId, status: 'ACTIVE' },
        });
        return {
            activeMedications,
            polypharmacy: activeMedications >= 5,
        };
    }
    calculateImc(weight, height) {
        if (!weight || !height)
            return null;
        if (height <= 0)
            return null;
        return weight / (height * height);
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthService);
//# sourceMappingURL=health.service.js.map