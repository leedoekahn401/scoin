import { z } from '../../../common/zod';

// Field list: SRS B6 / https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook

/** Payload SePay POSTs to /webhooks/sepay. */
export const sepayWebhookSchema = z.object({
  id: z.number().int(),
  gateway: z.string(),
  transactionDate: z.string(),
  accountNumber: z.string(),
  code: z.string().nullish(),
  content: z.string(),
  transferType: z.enum(['in', 'out']),
  transferAmount: z.number().int(),
  accumulated: z.number().int(),
  subAccount: z.string().nullish(),
  referenceCode: z.string(),
  description: z.string().optional(),
});

export type SepayWebhook = z.infer<typeof sepayWebhookSchema>;
