import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { kioskStudentRoute } from '../../common/http/guards';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-4 — FR-REQ-01…04, FR-KIO-03, UC-11, UC-06 */
export const requestsRouter = Router();
const tag = 'requests';

/** {amountCredits, note?} — max 3 per day (BR-09); notifies every linked parent. */
route(requestsRouter, {
  method: 'post',
  path: '/kiosk/requests',
  name: 'create',
  tag,
  ...kioskStudentRoute,
  handler: () => notImplemented('FR-KIO-03'),
});

/** ?status */
route(requestsRouter, {
  method: 'get',
  path: '/parent/requests',
  name: 'list',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('FR-REQ-02'),
});

/** Creates and returns a top-up for the request amount (or a changed amount). */
route(requestsRouter, {
  method: 'post',
  path: '/parent/requests/:id/approve',
  name: 'approve',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('FR-REQ-02'),
});

/** {reason?} */
route(requestsRouter, {
  method: 'post',
  path: '/parent/requests/:id/decline',
  name: 'decline',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  status: 200,
  handler: () => notImplemented('FR-REQ-02'),
});
