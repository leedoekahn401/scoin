import type { CreateOrderDto } from '@schoolcoin/types';
import { z } from '../../../common/zod';

// z.guid() accepts any 8-4-4-4-12 hex id, like class-validator's IsUUID().
export const orderLineSchema = z.object({
  menuItemId: z.guid(),
  quantity: z.number().int().min(1),
});

export const createOrderSchema = z
  .object({
    cardCode: z.string().openapi({ description: 'Scanned card code' }),
    items: z.array(orderLineSchema).min(1),
    pin: z
      .string()
      .regex(/^\d{4}$/)
      .optional()
      .openapi({ description: 'Required when the total exceeds the PIN threshold' }),
    idempotencyKey: z
      .guid()
      .openapi({ description: 'One per checkout; retries reuse it (NFR-REL-02)' }),
  })
  .openapi('CreateOrderDto') satisfies z.ZodType<CreateOrderDto>;
