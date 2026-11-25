import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-2 — FR-ADM-01, FR-ADM-03, and the parent's view of linked children (UC-03). */
export const studentsRouter = Router();
const tag = 'students';

// ---- parent (FR-FAM-04: only linked children)

/** Linked children with balance. */
route(studentsRouter, {
  method: 'get',
  path: '/parent/children',
  name: 'myChildren',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('UC-03'),
});

/** Balance, today's spending, controls, card status. */
route(studentsRouter, {
  method: 'get',
  path: '/parent/children/:studentId',
  name: 'child',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('UC-03'),
});

/** ?from&to&type&page — ledger with order items. */
route(studentsRouter, {
  method: 'get',
  path: '/parent/children/:studentId/transactions',
  name: 'transactions',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('UC-03'),
});

// ---- admin

route(studentsRouter, {
  method: 'get',
  path: '/admin/students',
  name: 'list',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-01'),
});

/** Creates the student and a 0-credit wallet (FR-WAL-01). */
route(studentsRouter, {
  method: 'post',
  path: '/admin/students',
  name: 'create',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-01'),
});

/** CSV upload (student code, full name, class, optional photo); per-row result. */
route(studentsRouter, {
  method: 'post',
  path: '/admin/students/import',
  name: 'import',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-01'),
});

route(studentsRouter, {
  method: 'get',
  path: '/admin/students/:id',
  name: 'get',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-01'),
});

/** Edit or deactivate; deactivation needs a 0 balance (BR-14). */
route(studentsRouter, {
  method: 'patch',
  path: '/admin/students/:id',
  name: 'update',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-01'),
});

route(studentsRouter, {
  method: 'put',
  path: '/admin/students/:id/pin',
  name: 'setPin',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-03'),
});
