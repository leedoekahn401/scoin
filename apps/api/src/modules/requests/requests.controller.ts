import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { KioskDeviceGuard } from '../../common/guards/kiosk-device.guard';
import { KioskSessionGuard } from '../../common/guards/kiosk-session.guard';
import { notImplemented } from '../../common/utils/todo';
import { RequestsService } from './requests.service';

/** BE-4 — FR-REQ-01…04, FR-KIO-03, UC-11, UC-06 */
@ApiTags('requests')
@Controller()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  /** {amountCredits, note?} — max 3 per day (BR-09); notifies every linked parent. */
  @Public()
  @UseGuards(KioskDeviceGuard, KioskSessionGuard)
  @ApiSecurity('kiosk-device')
  @ApiSecurity('kiosk-session')
  @Post('kiosk/requests')
  create() {
    notImplemented('FR-KIO-03');
  }

  /** ?status */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Get('parent/requests')
  list() {
    notImplemented('FR-REQ-02');
  }

  /** Creates and returns a top-up for the request amount (or a changed amount). */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Post('parent/requests/:id/approve')
  approve() {
    notImplemented('FR-REQ-02');
  }

  /** {reason?} */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Post('parent/requests/:id/decline')
  @HttpCode(200)
  decline() {
    notImplemented('FR-REQ-02');
  }
}
