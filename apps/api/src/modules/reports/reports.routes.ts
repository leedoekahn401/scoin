import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-4 (sales, top-ups, dashboard) and BE-3 (reconciliation) — FR-RPT-01…05. All take ?from&to&groupBy and ?format=csv. */
export const reportsRouter = Router();
const tag = 'admin: reports';

route(reportsRouter, {
  method: 'get',
  path: '/admin/reports/sales',
  name: 'sales',
  tag,
  roles: PERMISSIONS.SALES_REPORTS,
  handler: () => notImplemented('FR-RPT-01'),
});

route(reportsRouter, {
  method: 'get',
  path: '/admin/reports/topups',
  name: 'topups',
  tag,
  roles: PERMISSIONS.FINANCE_REPORTS,
  handler: () => notImplemented('FR-RPT-02'),
});

route(reportsRouter, {
  method: 'get',
  path: '/admin/reports/balances',
  name: 'balances',
  tag,
  roles: PERMISSIONS.FINANCE_REPORTS,
  handler: () => notImplemented('FR-RPT-03'),
});

route(reportsRouter, {
  method: 'get',
  path: '/admin/reports/reconciliation',
  name: 'reconciliation',
  tag,
  roles: PERMISSIONS.FINANCE_REPORTS,
  handler: () => notImplemented('FR-RPT-04'),
});

/** Today's sales, today's top-ups, unmatched payments waiting, outstanding balance. */
route(reportsRouter, {
  method: 'get',
  path: '/admin/reports/dashboard',
  name: 'dashboard',
  tag,
  roles: PERMISSIONS.SALES_REPORTS,
  handler: () => notImplemented('FR-RPT-05'),
});
