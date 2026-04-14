import type { User } from '@prisma/client';
import { MedicationsService } from './medications.service';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { UpdateMedicationStatusDto } from './dto/update-medication-status.dto';
export declare class MedicationsController {
    private readonly medicationsService;
    constructor(medicationsService: MedicationsService);
    list(user: User): Promise<{
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
    get(user: User, id: string): Promise<{
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
    create(user: User, dto: CreateMedicationDto): Promise<{
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
    update(user: User, id: string, dto: UpdateMedicationDto): Promise<{
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
    updateStatus(user: User, id: string, dto: UpdateMedicationStatusDto): Promise<{
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
    remove(user: User, id: string): Promise<{
        success: boolean;
    }>;
}
