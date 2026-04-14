"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    supabase;
    constructor(prisma) {
        this.prisma = prisma;
        this.supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    }
    async register(dto) {
        const { data, error } = await this.supabase.auth.signUp({
            email: dto.email,
            password: dto.password,
        });
        if (error) {
            if (error.message.includes('already registered')) {
                throw new common_1.ConflictException('Email already in use');
            }
            throw new common_1.InternalServerErrorException(error.message);
        }
        if (!data.user) {
            throw new common_1.InternalServerErrorException('Failed to create auth user');
        }
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                role: dto.role,
            },
        });
        return {
            user,
            session: data.session,
        };
    }
    async login(dto) {
        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: dto.email,
            password: dto.password,
        });
        if (error) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        return {
            user,
            session: data.session,
        };
    }
    async refresh(refreshToken) {
        const { data, error } = await this.supabase.auth.refreshSession({
            refresh_token: refreshToken,
        });
        if (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        return { session: data.session };
    }
    async logout() {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            throw new common_1.InternalServerErrorException(error.message);
        }
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map