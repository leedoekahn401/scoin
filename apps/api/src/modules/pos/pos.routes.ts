import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';
import { createOrderSchema } from './dto/create-order.dto';

/** BE-2 — FR-POS-01…09, UC-08, UC-09 */
export const posRouter = Router();
const tag = 'pos';

/** Categories with available items (FR-POS-01). */
route(posRouter, {
  method: 'get',
  path: '/pos/menu',
  name: 'menu',
  tag,
  roles: PERMISSIONS.POS_CHARGE,
  handler: () => notImplemented('FR-POS-01'),
});

/** {cardCode} → studentId, fullName, className, photoUrl, balance, remainingToday, pinThreshold. */
route(posRouter, {
  method: 'post',
  path: '/pos/lookup',
  name: 'lookup',
  tag,
  roles: PERMISSIONS.POS_CHARGE,
  status: 200,
  handler: () => notImplemented('FR-POS-04'),
});

/**
 * 201 order, or 422 with CARD_INACTIVE, PIN_REQUIRED, PIN_INVALID, PIN_LOCKED,
 * INSUFFICIENT_BALANCE, DAILY_LIMIT_REACHED or ITEM_UNAVAILABLE.
 */
route(posRouter, {
  method: 'post',
  path: '/pos/orders',
  name: 'charge',
  tag,
  roles: PERMISSIONS.POS_CHARGE,
  body: createOrderSchema,
  handler: () => notImplemented('FR-POS-06'),
});

/** Today's orders: own for a cashier, all for a manager or admin. */
route(posRouter, {
  method: 'get',
  path: '/pos/orders',
  name: 'today',
  tag,
  roles: PERMISSIONS.VOID_OWN_ORDER,
  handler: () => notImplemented('FR-POS-08'),
});

/** {reason} — same day only; cashiers only their own orders (FR-POS-07, BR-10). */
route(posRouter, {
  method: 'post',
  path: '/pos/orders/:id/void',
  name: 'void',
  tag,
  roles: PERMISSIONS.VOID_OWN_ORDER,
  status: 200,
  handler: () => notImplemented('FR-POS-07'),
});
