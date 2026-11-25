import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-4 — FR-NOT-01 */
export const notificationsRouter = Router();
const tag = 'notifications';
const roles = PERMISSIONS.OWN_CHILDREN;

/** List with unread count. */
route(notificationsRouter, {
  method: 'get',
  path: '/notifications',
  name: 'list',
  tag,
  roles,
  handler: () => notImplemented('FR-NOT-01'),
});

route(notificationsRouter, {
  method: 'patch',
  path: '/notifications/:id/read',
  name: 'markRead',
  tag,
  roles,
  handler: () => notImplemented('FR-NOT-01'),
});

route(notificationsRouter, {
  method: 'post',
  path: '/notifications/read-all',
  name: 'markAllRead',
  tag,
  roles,
  status: 204,
  handler: () => notImplemented('FR-NOT-01'),
});
