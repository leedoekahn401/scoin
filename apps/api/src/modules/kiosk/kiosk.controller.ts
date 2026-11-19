import { Controller, Delete, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PERMISSIONS, RULES } from '@schoolcoin/types';
import { Audit } from '../../common/decorators/audit.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { KioskDeviceGuard } from '../../common/guards/kiosk-device.guard';
import { KioskSessionGuard } from '../../common/guards/kiosk-session.guard';
import { notImplemented } from '../../common/utils/todo';
import { KioskService } from './kiosk.service';

/** BE-4 — FR-KIO-01…06, FR-ADM-06, UC-10 */
@ApiTags('kiosk')
@Controller()
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  /** {cardCode, pin} → session token; expires 2 minutes after last activity. */
  @Public()
  @UseGuards(KioskDeviceGuard)
  @ApiSecurity('kiosk-device')
  @Throttle({ default: { limit: RULES.RATE_LIMIT_KIOSK_PIN, ttl: 60_000 } })
  @Post('kiosk/sessions')
  signIn() {
    notImplemented('FR-KIO-01');
  }

  /** Balance, today's spending, daily limit, last 10 transactions, requests from 7 days. */
  @Public()
  @UseGuards(KioskDeviceGuard, KioskSessionGuard)
  @ApiSecurity('kiosk-device')
  @ApiSecurity('kiosk-session')
  @Get('kiosk/me')
  me() {
    notImplemented('FR-KIO-02');
  }

  @Public()
  @UseGuards(KioskDeviceGuard, KioskSessionGuard)
  @ApiSecurity('kiosk-device')
  @ApiSecurity('kiosk-session')
  @Delete('kiosk/sessions/current')
  @HttpCode(204)
  signOut() {
    notImplemented('FR-KIO-05');
  }

  @Roles(...PERMISSIONS.SYSTEM)
  @Get('admin/kiosk-devices')
  devices() {
    notImplemented('FR-ADM-06');
  }

  /** Returns the device key once; only its hash is stored. */
  @Roles(...PERMISSIONS.SYSTEM)
  @Audit('KIOSK_REGISTERED', 'KioskDevice')
  @Post('admin/kiosk-devices')
  register() {
    notImplemented('FR-ADM-06');
  }

  @Roles(...PERMISSIONS.SYSTEM)
  @Audit('KIOSK_REVOKED', 'KioskDevice')
  @Delete('admin/kiosk-devices/:id')
  @HttpCode(204)
  revoke() {
    notImplemented('FR-ADM-06');
  }
}
