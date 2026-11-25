import { PERMISSIONS } from '@schoolcoin/types';
import { Router } from 'express';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';

/** BE-2 — FR-CTL-01…03 */
export const controlsRouter = Router();

/** {dailyLimitCredits, lowBalanceThreshold}; null turns a control off. */
route(controlsRouter, {
  method: 'patch',
  path: '/parent/children/:studentId/controls',
  name: 'update',
  tag: 'parent: controls',
  roles: PERMISSIONS.OWN_CHILDREN,
  handler: () => notImplemented('FR-CTL-01'),
});
