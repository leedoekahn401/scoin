import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-1 — FR-FAM-01…05 */
export const familiesRouter = Router();
const tag = 'families';

/** {inviteCode} — link another child (FR-FAM-02). */
route(familiesRouter, {
  method: 'post',
  path: '/parent/children/link',
  name: 'link',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('FR-FAM-02'),
});

/** One-time invite code, valid 14 days (FR-FAM-01). */
route(familiesRouter, {
  method: 'post',
  path: '/admin/students/:id/invites',
  name: 'createInvite',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-FAM-01'),
});

route(familiesRouter, {
  method: 'delete',
  path: '/admin/students/:id/parents/:parentId',
  name: 'unlink',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-FAM-05'),
});
