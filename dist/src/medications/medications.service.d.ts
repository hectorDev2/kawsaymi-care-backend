import { MedStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
export declare class MedicationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(userId: string): Promise<{
        medications: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dose: string;
            frequency: number;
            intervalHours: number;
            instructions: string | null;
            startDate: Date;
            endDate: Date | null;
            schedule: string[];
            userId: string;
            status: import("@prisma/client").$Enums.MedStatus;
        }[];
    }>;
    get(userId: string, id: string): Promise<{
        medication: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dose: string;
            frequency: number;
            intervalHours: number;
            instructions: string | null;
            startDate: Date;
            endDate: Date | null;
            schedule: string[];
            userId: string;
            status: import("@prisma/client").$Enums.MedStatus;
        };
    }>;
    create(userId: string, dto: CreateMedicationDto): Promise<{
        medication: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dose: string;
            frequency: number;
            intervalHours: number;
            instructions: string | null;
            startDate: Date;
            endDate: Date | null;
            schedule: string[];
            userId: string;
            status: import("@prisma/client").$Enums.MedStatus;
        };
    }>;
    update(userId: string, id: string, dto: UpdateMedicationDto): Promise<{
        medication: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dose: string;
            frequency: number;
            intervalHours: number;
            instructions: string | null;
            startDate: Date;
            endDate: Date | null;
            schedule: string[];
            userId: string;
            status: import("@prisma/client").$Enums.MedStatus;
        };
    }>;
    updateStatus(userId: string, id: string, status: MedStatus): Promise<{
        medication: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dose: string;
            frequency: number;
            intervalHours: number;
            instructions: string | null;
            startDate: Date;
            endDate: Date | null;
            schedule: string[];
            userId: string;
            status: import("@prisma/client").$Enums.MedStatus;
        };
    }>;
    remove(userId: string, id: string): Promise<{
        success: boolean;
    }>;
}
