import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-4 — FR-MENU-01…03, UC-12 */
export const menuRouter = Router();
const tag = 'admin: menu';
const roles = PERMISSIONS.MENU_AND_CASHIERS;

route(menuRouter, {
  method: 'get',
  path: '/admin/menu/categories',
  name: 'categories',
  tag,
  roles,
  handler: () => notImplemented('FR-MENU-01'),
});

route(menuRouter, {
  method: 'post',
  path: '/admin/menu/categories',
  name: 'createCategory',
  tag,
  roles,
  handler: () => notImplemented('FR-MENU-01'),
});

route(menuRouter, {
  method: 'patch',
  path: '/admin/menu/categories/:id',
  name: 'updateCategory',
  tag,
  roles,
  handler: () => notImplemented('FR-MENU-01'),
});

route(menuRouter, {
  method: 'get',
  path: '/admin/menu/items',
  name: 'items',
  tag,
  roles,
  handler: () => notImplemented('FR-MENU-01'),
});

route(menuRouter, {
  method: 'post',
  path: '/admin/menu/items',
  name: 'createItem',
  tag,
  roles,
  handler: () => notImplemented('FR-MENU-01'),
});

/** Price changes apply to new orders only (FR-MENU-02). */
route(menuRouter, {
  method: 'patch',
  path: '/admin/menu/items/:id',
  name: 'updateItem',
  tag,
  roles,
  audit: { action: 'MENU_ITEM_UPDATED', entity: 'MenuItem' },
  handler: () => notImplemented('FR-MENU-01'),
});

/** Sold out for today only (VN calendar day). */
route(menuRouter, {
  method: 'post',
  path: '/admin/menu/items/:id/sold-out',
  name: 'soldOut',
  tag,
  roles,
  status: 200,
  handler: () => notImplemented('FR-MENU-03'),
});
