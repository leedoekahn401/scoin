import { PERMISSIONS, RULES } from '@schoolcoin/types';
import { Router } from 'express';
import { sepayApiKey } from '../../common/http/guards';
import { route } from '../../common/http/route';
import { notImplemented } from '../../common/utils/todo';
import { sepayWebhookSchema } from './dto/sepay-webhook.dto';
import { sepayService } from './sepay.service';

/** BE-3 — FR-TOP-03, 04, 06, 07; UC-15, UC-23 */
export const sepayRouter = Router();
const tag = 'sepay';
const roles = PERMISSIONS.FINANCE;

/** SePay retries until it gets 200/201 with exactly {"success": true} (B6). */
route(sepayRouter, {
  method: 'post',
  path: '/webhooks/sepay',
  name: 'receive',
  tag,
  hidden: true,
  public: true,
  guards: [sepayApiKey],
  throttle: RULES.RATE_LIMIT_WEBHOOK,
  body: sepayWebhookSchema,
  status: 200,
  handler: async (req) => {
    await sepayService.handleWebhook(req.body);
    return { success: true };
  },
});

/** ?status=UNMATCHED&from&to */
route(sepayRouter, {
  method: 'get',
  path: '/admin/sepay-transactions',
  name: 'list',
  tag,
  roles,
  handler: () => notImplemented('FR-TOP-06'),
});

/** {studentId, note?} — credits the wallet with TOPUP_SEPAY, status RESOLVED. */
route(sepayRouter, {
  method: 'post',
  path: '/admin/sepay-transactions/:id/assign',
  name: 'assign',
  tag,
  roles,
  audit: { action: 'SEPAY_TX_ASSIGNED', entity: 'SepayTransaction' },
  status: 200,
  handler: () => notImplemented('FR-TOP-07'),
});

/** {reason} */
route(sepayRouter, {
  method: 'post',
  path: '/admin/sepay-transactions/:id/ignore',
  name: 'ignore',
  tag,
  roles,
  audit: { action: 'SEPAY_TX_IGNORED', entity: 'SepayTransaction' },
  status: 200,
  handler: () => notImplemented('FR-TOP-07'),
});
