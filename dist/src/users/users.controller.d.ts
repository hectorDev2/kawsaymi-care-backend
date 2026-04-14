import type { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateAllergiesDto } from './dto/update-allergies.dto';
import { UpdateConditionsDto } from './dto/update-conditions.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    me(user: User): Promise<{
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
    updateMe(user: User, dto: UpdateMeDto): Promise<{
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
    updateAllergies(user: User, dto: UpdateAllergiesDto): Promise<{
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
    updateConditions(user: User, dto: UpdateConditionsDto): Promise<{
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
    deleteMe(user: User): Promise<{
        success: boolean;
    }>;
}
