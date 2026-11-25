import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-3 — FR-RFD-01, adjustments (BR-10) */
export const financeRouter = Router();
const tag = 'admin: finance';
const roles = PERMISSIONS.FINANCE;

/** {studentId, amountCredits, method, note} — payout happens outside the system. */
route(financeRouter, {
  method: 'post',
  path: '/admin/refunds',
  name: 'refund',
  tag,
  roles,
  audit: { action: 'REFUND_CREATED', entity: 'Refund' },
  handler: () => notImplemented('FR-RFD-01'),
});

/** {studentId, amountCredits (±), reason} */
route(financeRouter, {
  method: 'post',
  path: '/admin/adjustments',
  name: 'adjust',
  tag,
  roles,
  audit: { action: 'ADJUSTMENT_CREATED', entity: 'LedgerEntry' },
  handler: () => notImplemented('BR-10'),
});
