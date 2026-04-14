import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly supabase;
    constructor(prisma: PrismaService);
    register(dto: RegisterDto): Promise<{
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
        session: import("@supabase/supabase-js").AuthSession | null;
    }>;
    login(dto: LoginDto): Promise<{
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
        } | null;
        session: import("@supabase/supabase-js").AuthSession;
    }>;
    refresh(refreshToken: string): Promise<{
        session: import("@supabase/supabase-js").AuthSession | null;
    }>;
    logout(): Promise<{
        success: boolean;
    }>;
}
