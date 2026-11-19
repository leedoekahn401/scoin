import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '@schoolcoin/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { notImplemented } from '../../common/utils/todo';
import { ReportsService } from './reports.service';

/** BE-4 (sales, top-ups, dashboard) and BE-3 (reconciliation) — FR-RPT-01…05. All take ?from&to&groupBy and ?format=csv. */
@ApiTags('admin: reports')
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(...PERMISSIONS.SALES_REPORTS)
  @Get('sales')
  sales() {
    notImplemented('FR-RPT-01');
  }

  @Roles(...PERMISSIONS.FINANCE_REPORTS)
  @Get('topups')
  topups() {
    notImplemented('FR-RPT-02');
  }

  @Roles(...PERMISSIONS.FINANCE_REPORTS)
  @Get('balances')
  balances() {
    notImplemented('FR-RPT-03');
  }

  @Roles(...PERMISSIONS.FINANCE_REPORTS)
  @Get('reconciliation')
  reconciliation() {
    notImplemented('FR-RPT-04');
  }

  /** Today's sales, today's top-ups, unmatched payments waiting, outstanding balance. */
  @Roles(...PERMISSIONS.SALES_REPORTS)
  @Get('dashboard')
  dashboard() {
    notImplemented('FR-RPT-05');
  }
}
