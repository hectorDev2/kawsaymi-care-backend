import { PrismaService } from '../prisma/prisma.service';
import { EventsRangeQueryDto } from './dto/events-range-query.dto';
type MarkStatus = 'TAKEN' | 'MISSED';
export declare class EventsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private toISOOrThrow;
    today(userId: string): Promise<{
        events: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.EventStatus;
            medicationId: string;
            dateTimeScheduled: Date;
        }[];
    }>;
    week(userId: string): Promise<{
        events: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.EventStatus;
            medicationId: string;
            dateTimeScheduled: Date;
        }[];
    }>;
    ensureRange(userId: string, fromISO: string, toISO: string): Promise<{
        success: boolean;
    }>;
    list(userId: string, query: EventsRangeQueryDto): Promise<{
        events: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.EventStatus;
            medicationId: string;
            dateTimeScheduled: Date;
        }[];
    }>;
    mark(userId: string, id: string, status: MarkStatus): Promise<{
        event: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.EventStatus;
            medicationId: string;
            dateTimeScheduled: Date;
        };
    }>;
    private getUserTimezone;
    private getUserDayRange;
    private getUserWeekRange;
    private ensureEventsForRange;
}
export {};
