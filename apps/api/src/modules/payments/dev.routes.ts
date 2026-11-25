import { Router } from 'express';
import { route } from '../../common/http/route';
import { z } from '../../common/zod';
import { mockPaymentProvider } from './mock-payment.provider';
import { paymentsService } from './payments.service';

/**
 * Demo controls for the mock payment provider (ADR 0007). app.ts mounts this router only while
 * the mock provider is active, since any signed-in user can make credits appear with it.
 */
export const devRouter = Router();
const tag = 'dev';

/** Stands in for the parent paying: {amountVnd, content} → the recorded transfer. */
route(devRouter, {
  method: 'post',
  path: '/dev/simulate-transfer',
  name: 'simulateTransfer',
  tag,
  hidden: true,
  body: z.object({
    amountVnd: z.number().int().min(1).max(100_000_000),
    content: z.string().trim().min(1).max(500),
  }),
  status: 200,
  handler: (req) => paymentsService.receiveTransfer(mockPaymentProvider.transfer(req.body)),
});
