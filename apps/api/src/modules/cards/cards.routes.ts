import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-2 — FR-ADM-02, FR-CTL-04, UC-07 */
export const cardsRouter = Router();
const tag = 'cards';

/** Locks the child's active card immediately. */
route(cardsRouter, {
  method: 'post',
  path: '/parent/children/:studentId/card/lock',
  name: 'lockByParent',
  tag,
  roles: PERMISSIONS.OWN_CHILDREN,
  status: 200,
  handler: () => notImplemented('FR-CTL-04'),
});

/** Issues a new card; the previous active card becomes REPLACED (BR-12). */
route(cardsRouter, {
  method: 'post',
  path: '/admin/students/:id/cards',
  name: 'issue',
  tag,
  roles: PERMISSIONS.STUDENTS,
  audit: { action: 'CARD_ISSUED', entity: 'Card' },
  handler: () => notImplemented('FR-ADM-02'),
});

route(cardsRouter, {
  method: 'post',
  path: '/admin/cards/:id/lock',
  name: 'lock',
  tag,
  roles: PERMISSIONS.STUDENTS,
  audit: { action: 'CARD_LOCKED', entity: 'Card' },
  status: 200,
  handler: () => notImplemented('FR-ADM-02'),
});

/** ?studentIds=… — data for the printable card sheet. */
route(cardsRouter, {
  method: 'get',
  path: '/admin/cards/print',
  name: 'print',
  tag,
  roles: PERMISSIONS.STUDENTS,
  handler: () => notImplemented('FR-ADM-02'),
});
