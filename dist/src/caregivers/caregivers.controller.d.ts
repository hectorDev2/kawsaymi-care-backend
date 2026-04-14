import type { User } from '@prisma/client';
import { CaregiversService } from './caregivers.service';
import { InviteCaregiverDto } from './dto/invite-caregiver.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
export declare class CaregiversController {
    private readonly caregiversService;
    constructor(caregiversService: CaregiversService);
    invite(user: User, dto: InviteCaregiverDto): Promise<{
        relation: {
            caregiver: {
                email: string;
                name: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
                dateOfBirth: Date | null;
                location: string | null;
                language: string;
                timezone: string;
                allergies: string[];
                conditions: string[];
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            permissions: string[];
            patientId: string;
            caregiverId: string;
        };
    }>;
    myPatients(user: User): Promise<{
        relations: ({
            patient: {
                email: string;
                name: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
                dateOfBirth: Date | null;
                location: string | null;
                language: string;
                timezone: string;
                allergies: string[];
                conditions: string[];
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            permissions: string[];
            patientId: string;
            caregiverId: string;
        })[];
    }>;
    myCaregivers(user: User): Promise<{
        relations: ({
            caregiver: {
                email: string;
                name: string;
                role: import("@prisma/client").$Enums.Role;
                id: string;
                dateOfBirth: Date | null;
                location: string | null;
                language: string;
                timezone: string;
                allergies: string[];
                conditions: string[];
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            permissions: string[];
            patientId: string;
            caregiverId: string;
        })[];
    }>;
    updatePermissions(user: User, id: string, dto: UpdatePermissionsDto): Promise<{
        relation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            permissions: string[];
            patientId: string;
            caregiverId: string;
        };
    }>;
    remove(user: User, id: string): Promise<{
        success: boolean;
    }>;
    alerts(user: User, patientId: string): Promise<{
        missedEvents: ({
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.EventStatus;
            medicationId: string;
            dateTimeScheduled: Date;
        })[];
        adherenceRate: number;
        lowAdherence: boolean;
    }>;
}
