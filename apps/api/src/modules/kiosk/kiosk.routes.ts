import { PERMISSIONS, RULES } from '@schoolcoin/types';
import { Router } from 'express';
import { kioskDevice, kioskStudentRoute } from '../../common/http/guards';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-4 — FR-KIO-01…06, FR-ADM-06, UC-10 */
export const kioskRouter = Router();
const tag = 'kiosk';

/** {cardCode, pin} → session token; expires 2 minutes after last activity. */
route(kioskRouter, {
  method: 'post',
  path: '/kiosk/sessions',
  name: 'signIn',
  tag,
  public: true,
  guards: [kioskDevice],
  security: ['kiosk-device'],
  throttle: RULES.RATE_LIMIT_KIOSK_PIN,
  handler: () => notImplemented('FR-KIO-01'),
});

/** Balance, today's spending, daily limit, last 10 transactions, requests from 7 days. */
route(kioskRouter, {
  method: 'get',
  path: '/kiosk/me',
  name: 'me',
  tag,
  ...kioskStudentRoute,
  handler: () => notImplemented('FR-KIO-02'),
});

route(kioskRouter, {
  method: 'delete',
  path: '/kiosk/sessions/current',
  name: 'signOut',
  tag,
  ...kioskStudentRoute,
  status: 204,
  handler: () => notImplemented('FR-KIO-05'),
});

route(kioskRouter, {
  method: 'get',
  path: '/admin/kiosk-devices',
  name: 'devices',
  tag,
  roles: PERMISSIONS.SYSTEM,
  handler: () => notImplemented('FR-ADM-06'),
});

/** Returns the device key once; only its hash is stored. */
route(kioskRouter, {
  method: 'post',
  path: '/admin/kiosk-devices',
  name: 'register',
  tag,
  roles: PERMISSIONS.SYSTEM,
  audit: { action: 'KIOSK_REGISTERED', entity: 'KioskDevice' },
  handler: () => notImplemented('FR-ADM-06'),
});

route(kioskRouter, {
  method: 'delete',
  path: '/admin/kiosk-devices/:id',
  name: 'revoke',
  tag,
  roles: PERMISSIONS.SYSTEM,
  audit: { action: 'KIOSK_REVOKED', entity: 'KioskDevice' },
  status: 204,
  handler: () => notImplemented('FR-ADM-06'),
});
