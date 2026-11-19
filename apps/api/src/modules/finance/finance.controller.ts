import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Audit } from '../../common/decorators/audit.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { FinanceService } from './finance.service';

/** BE-3 — FR-RFD-01, adjustments (BR-10) */
@ApiTags('admin: finance')
@Roles(...PERMISSIONS.FINANCE)
@Controller('admin')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  /** {studentId, amountCredits, method, note} — payout happens outside the system. */
  @Audit('REFUND_CREATED', 'Refund')
  @Post('refunds')
  refund() {
    notImplemented('FR-RFD-01');
  }

  /** {studentId, amountCredits (±), reason} */
  @Audit('ADJUSTMENT_CREATED', 'LedgerEntry')
  @Post('adjustments')
  adjust() {
    notImplemented('BR-10');
  }
}
