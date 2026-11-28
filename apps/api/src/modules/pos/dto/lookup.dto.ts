import type { PosLookupDto } from '@schoolcoin/types';
import { z } from '../../../common/zod';

export const lookupSchema = z
  .object({
    cardCode: z.string().trim().min(1).openapi({ description: 'Scanned card code' }),
  })
  .openapi('PosLookupDto') satisfies z.ZodType<PosLookupDto>;
