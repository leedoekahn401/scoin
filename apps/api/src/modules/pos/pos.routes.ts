import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { currentUser, idParam } from '../../common/http/request';
import { route } from '../../common/http/route';
import { createOrderSchema } from './dto/create-order.dto';
import { lookupSchema } from './dto/lookup.dto';
import { voidOrderSchema } from './dto/void-order.dto';
import { posService } from './pos.service';

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
  handler: () => posService.menu(),
});

/** {cardCode} → studentId, fullName, className, photoUrl, balance, remainingToday, pinThreshold. */
route(posRouter, {
  method: 'post',
  path: '/pos/lookup',
  name: 'lookup',
  tag,
  roles: PERMISSIONS.POS_CHARGE,
  status: 200,
  body: lookupSchema,
  handler: (req) => posService.lookup(req.body.cardCode),
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
  handler: (req) => posService.charge(currentUser(req).id, req.body),
});

/** Today's orders: own for a cashier, all for a manager or admin. */
route(posRouter, {
  method: 'get',
  path: '/pos/orders',
  name: 'today',
  tag,
  roles: PERMISSIONS.VOID_OWN_ORDER,
  handler: (req) => posService.today(currentUser(req)),
});

/** {reason} — same day only; cashiers only their own orders (FR-POS-07, BR-10). */
route(posRouter, {
  method: 'post',
  path: '/pos/orders/:id/void',
  name: 'void',
  tag,
  roles: PERMISSIONS.VOID_OWN_ORDER,
  status: 200,
  body: voidOrderSchema,
  audit: { action: 'order.void', entity: 'Order' },
  handler: (req) => posService.void(currentUser(req), idParam(req), req.body.reason),
});
