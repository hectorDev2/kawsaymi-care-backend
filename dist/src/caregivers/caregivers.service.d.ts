import { PrismaService } from '../prisma/prisma.service';
import { InviteCaregiverDto } from './dto/invite-caregiver.dto';
export declare class CaregiversService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    invite(patientId: string, dto: InviteCaregiverDto): Promise<{
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
    myPatients(caregiverId: string): Promise<{
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
    myCaregivers(patientId: string): Promise<{
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
    updatePermissions(userId: string, relationId: string, permissions: string[]): Promise<{
        relation: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            permissions: string[];
            patientId: string;
            caregiverId: string;
        };
    }>;
    remove(userId: string, relationId: string): Promise<{
        success: boolean;
    }>;
    patientAlerts(caregiverId: string, patientId: string): Promise<{
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
