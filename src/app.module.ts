import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MedicationsModule } from './medications/medications.module';
import { EventsModule } from './events/events.module';
import { AdherenceModule } from './adherence/adherence.module';
import { HealthModule } from './health/health.module';
import { CaregiversModule } from './caregivers/caregivers.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    MedicationsModule,
    EventsModule,
    AdherenceModule,
    HealthModule,
    CaregiversModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
