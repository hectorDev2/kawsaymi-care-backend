import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
        session: import("@supabase/auth-js").Session | null;
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
        session: import("@supabase/auth-js").Session;
    }>;
    refresh(dto: RefreshDto): Promise<{
        session: import("@supabase/auth-js").Session | null;
    }>;
    logout(): Promise<{
        success: boolean;
    }>;
}
