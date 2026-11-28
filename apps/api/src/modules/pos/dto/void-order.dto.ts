import type { VoidOrderDto } from '@schoolcoin/types';
import { z } from '../../../common/zod';

export const voidOrderSchema = z
  .object({
    reason: z.string().trim().min(1).max(500),
  })
  .openapi('VoidOrderDto') satisfies z.ZodType<VoidOrderDto>;
