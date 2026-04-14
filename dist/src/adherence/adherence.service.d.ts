import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
export declare class AdherenceService {
    private readonly prisma;
    private readonly eventsService;
    constructor(prisma: PrismaService, eventsService: EventsService);
    today(userId: string): Promise<{
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    week(userId: string): Promise<{
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    month(userId: string): Promise<{
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    stats(userId: string): Promise<{
        activeMedications: number;
        taken: number;
        missed: number;
        pending: number;
        total: number;
        adherenceRate: number;
    }>;
    private summarize;
    private getUserTimezone;
    private getUserDayRange;
    private getUserWeekRange;
}
