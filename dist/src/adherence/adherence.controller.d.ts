import type { User } from '@prisma/client';
import { AdherenceService } from './adherence.service';
export declare class AdherenceController {
    private readonly adherenceService;
    constructor(adherenceService: AdherenceService);
    today(user: User): Promise<{
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    week(user: User): Promise<{
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    month(user: User): Promise<{
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    stats(user: User): Promise<{
        activeMedications: number;
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
}
