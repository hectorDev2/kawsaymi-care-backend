import type { User } from '@prisma/client';
import { HealthService } from './health.service';
import { UpdateWeightDto } from './dto/update-weight.dto';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    profile(user: User): Promise<{
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
    updateWeight(user: User, dto: UpdateWeightDto): Promise<{
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
    imc(user: User): Promise<{
        imc: number | null;
    }>;
    polypharmacy(user: User): Promise<{
        activeMedications: number;
        polypharmacy: boolean;
    }>;
}
