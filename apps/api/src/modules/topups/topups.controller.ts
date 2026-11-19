import { Controller, Get, HttpCode, MessageEvent, Post, Sse } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import type { Observable } from 'rxjs';
import { Audit } from '../../common/decorators/audit.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { TopupsService } from './topups.service';

/** BE-3 — FR-TOP-01, 02, 05, 08, 09, 10; UC-04, UC-14 */
@ApiTags('topups')
@Controller()
export class TopupsController {
  constructor(private readonly topupsService: TopupsService) {}

  /**
   * {studentId, amountCredits, creditRequestId?} →
   * {id, paymentCode, qrUrl, amountVnd, bank, account, holder, expiresAt}
   */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Post('parent/topups')
  create() {
    notImplemented('FR-TOP-01');
  }

  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Get('parent/topups')
  recent() {
    notImplemented('FR-TOP-10');
  }

  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Get('parent/topups/:id')
  get() {
    notImplemented('FR-TOP-10');
  }

  /** SSE stream: one PAID or EXPIRED event (FR-TOP-05, NFR-PERF-02). */
  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Sse('parent/topups/:id/events')
  events(): Observable<MessageEvent> {
    notImplemented('FR-TOP-05');
  }

  @Roles(...PERMISSIONS.OWN_CHILDREN)
  @Post('parent/topups/:id/cancel')
  @HttpCode(200)
  cancel() {
    notImplemented('UC-04');
  }

  /** {studentId, amountCredits, note} → receipt number (FR-TOP-08). */
  @Roles(...PERMISSIONS.FINANCE)
  @Audit('CASH_TOPUP_CREATED', 'TopUp')
  @Post('admin/topups/cash')
  cash() {
    notImplemented('FR-TOP-08');
  }

  /** Top-ups flagged needsReview (amount mismatch, BR-06). */
  @Roles(...PERMISSIONS.FINANCE)
  @Get('admin/topups/review')
  review() {
    notImplemented('BR-06');
  }
}
