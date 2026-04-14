import type { User } from '@prisma/client';
import { EventsService } from './events.service';
import { EventsRangeQueryDto } from './dto/events-range-query.dto';
export declare class EventsController {
    private readonly eventsService;
    constructor(eventsService: EventsService);
    list(user: User, query: EventsRangeQueryDto): Promise<{
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
    today(user: User): Promise<{
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
    week(user: User): Promise<{
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
    markTaken(user: User, id: string): Promise<{
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
    markMissed(user: User, id: string): Promise<{
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
}
