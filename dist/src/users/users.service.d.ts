import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(userId: string): Promise<{
        user: {
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
    }>;
    updateMe(userId: string, dto: UpdateMeDto): Promise<{
        user: {
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
    }>;
    updateAllergies(userId: string, allergies: string[]): Promise<{
        user: {
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
    }>;
    updateConditions(userId: string, conditions: string[]): Promise<{
        user: {
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
    }>;
    deleteMe(userId: string): Promise<{
        success: boolean;
    }>;
}
