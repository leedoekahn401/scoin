import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-1 — FR-ADM-04. Managers may only list, create and deactivate cashiers (checked in the service). */
export const usersRouter = Router();
const tag = 'admin: users';
const roles = PERMISSIONS.MENU_AND_CASHIERS;

route(usersRouter, {
  method: 'get',
  path: '/admin/users',
  name: 'list',
  tag,
  roles,
  handler: () => notImplemented('FR-ADM-04'),
});

route(usersRouter, {
  method: 'post',
  path: '/admin/users',
  name: 'create',
  tag,
  roles,
  handler: () => notImplemented('FR-ADM-04'),
});

route(usersRouter, {
  method: 'patch',
  path: '/admin/users/:id',
  name: 'update',
  tag,
  roles,
  handler: () => notImplemented('FR-ADM-04'),
});
