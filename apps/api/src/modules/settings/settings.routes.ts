import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-4 — FR-ADM-05: PIN threshold, top-up min/max, top-up expiry, school bank details. */
export const settingsRouter = Router();
const tag = 'admin: settings';
const roles = PERMISSIONS.SYSTEM;

route(settingsRouter, {
  method: 'get',
  path: '/admin/settings',
  name: 'get',
  tag,
  roles,
  handler: () => notImplemented('FR-ADM-05'),
});

route(settingsRouter, {
  method: 'put',
  path: '/admin/settings',
  name: 'update',
  tag,
  roles,
  audit: { action: 'SETTINGS_UPDATED', entity: 'Setting' },
  handler: () => notImplemented('FR-ADM-05'),
});
