import { PrismaService } from '../prisma/prisma.service';
export declare class HealthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    profile(userId: string): Promise<{
        health: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            weight: number | null;
            height: number | null;
            imc: number | null;
            sleepHours: number | null;
            exerciseMinutes: number | null;
            waterLiters: number | null;
        };
    }>;
    updateWeight(userId: string, weight: number): Promise<{
        health: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            weight: number | null;
            height: number | null;
            imc: number | null;
            sleepHours: number | null;
            exerciseMinutes: number | null;
            waterLiters: number | null;
        };
    }>;
    imc(userId: string): Promise<{
        imc: number | null;
    }>;
    polypharmacy(userId: string): Promise<{
        activeMedications: number;
        polypharmacy: boolean;
    }>;
    private calculateImc;
}
