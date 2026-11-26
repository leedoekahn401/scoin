import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { currentUser, idParam } from '../../common/http/request';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';
import { createTopUpSchema } from './dto/create-topup.dto';
import { topupsService } from './topups.service';

/** BE-3 — FR-TOP-01, 02, 05, 08, 09, 10; UC-04, UC-14 */
export const topupsRouter = Router();
const tag = 'topups';

/**
 * {studentId, amountCredits, creditRequestId?} →
 * {id, paymentCode, qrUrl, amountVnd, bank, account, holder, expiresAt}
 */
route(topupsRouter, {
  method: 'post',
  path: '/parent/topups',
  name: 'create',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  body: createTopUpSchema,
  handler: (req) => topupsService.create(currentUser(req).id, req.body),
});

route(topupsRouter, {
  method: 'get',
  path: '/parent/topups',
  name: 'recent',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('FR-TOP-10'),
});

route(topupsRouter, {
  method: 'get',
  path: '/parent/topups/:id',
  name: 'get',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: (req) => topupsService.get(currentUser(req).id, idParam(req)),
});

/** SSE stream: one PAID or EXPIRED event (FR-TOP-05, NFR-PERF-02). The handler will write res itself. */
route(topupsRouter, {
  method: 'get',
  path: '/parent/topups/:id/events',
  name: 'events',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('FR-TOP-05'),
});

route(topupsRouter, {
  method: 'post',
  path: '/parent/topups/:id/cancel',
  name: 'cancel',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  status: 200,
  handler: (req) => topupsService.cancel(currentUser(req).id, idParam(req)),
});

/** {studentId, amountCredits, note} → receipt number (FR-TOP-08). */
route(topupsRouter, {
  method: 'post',
  path: '/admin/topups/cash',
  name: 'cash',
  tag,
  roles: PERMISSIONS.FINANCE,
  audit: { action: 'CASH_TOPUP_CREATED', entity: 'TopUp' },
  handler: () => notImplemented('FR-TOP-08'),
});

/** Top-ups flagged needsReview (amount mismatch, BR-06). */
route(topupsRouter, {
  method: 'get',
  path: '/admin/topups/review',
  name: 'review',
  tag,
  roles: PERMISSIONS.FINANCE,
  handler: () => notImplemented('BR-06'),
});
