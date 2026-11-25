import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-1 — FR-AUD-02 */
export const auditRouter = Router();
const tag = 'admin: audit';
const roles = PERMISSIONS.SYSTEM;

/** Filter by actor, action, entity, date. */
route(auditRouter, {
  method: 'get',
  path: '/admin/audit-logs',
  name: 'search',
  tag,
  roles,
  handler: () => notImplemented('FR-AUD-02'),
});
