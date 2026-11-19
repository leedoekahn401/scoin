import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { FamiliesModule } from './modules/families/families.module';
import { AuditModule } from './modules/audit/audit.module';
import { StudentsModule } from './modules/students/students.module';
import { CardsModule } from './modules/cards/cards.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { PosModule } from './modules/pos/pos.module';
import { ControlsModule } from './modules/controls/controls.module';
import { TopupsModule } from './modules/topups/topups.module';
import { SepayModule } from './modules/sepay/sepay.module';
import { FinanceModule } from './modules/finance/finance.module';
import { MenuModule } from './modules/menu/menu.module';
import { KioskModule } from './modules/kiosk/kiosk.module';
import { RequestsModule } from './modules/requests/requests.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    FamiliesModule,
    AuditModule,
    StudentsModule,
    CardsModule,
    WalletModule,
    PosModule,
    ControlsModule,
    TopupsModule,
    SepayModule,
    FinanceModule,
    MenuModule,
    KioskModule,
    RequestsModule,
    NotificationsModule,
    ReportsModule,
    SettingsModule,
    JobsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
