import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Keep supabase typing loose to avoid leaking generics across app.
  private readonly supabase: SupabaseClient<any, any, any>;

  constructor(private readonly prisma: PrismaService) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
    );
  }

  async register(dto: RegisterDto) {
    const { data, error } = await this.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictException('Email already in use');
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data.user) {
      throw new InternalServerErrorException('Failed to create auth user');
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

  async login(dto: LoginDto) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    return {
      user,
      session: data.session,
    };
  }

  async refresh(refreshToken: string) {
    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { session: data.session };
  }

  async logout() {
    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { success: true };
  }
}
