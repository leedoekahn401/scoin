import type { CreateTopUpDto } from '@schoolcoin/types';
import { z } from '../../../common/zod';

export const createTopUpSchema = z
  .object({
    studentId: z.guid(),
    amountCredits: z
      .number()
      .int()
      .openapi({ description: 'TOPUP_MIN_CREDITS–TOPUP_MAX_CREDITS (FR-TOP-01)' }),
    creditRequestId: z
      .guid()
      .optional()
      .openapi({ description: 'The kiosk request this top-up answers' }),
  })
  .openapi('CreateTopUpDto') satisfies z.ZodType<CreateTopUpDto>;
