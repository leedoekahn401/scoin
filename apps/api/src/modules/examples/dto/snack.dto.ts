import { dateRangeQuery, pageQuery } from '../../../common/http/query';
import { z } from '../../../common/zod';

const snackFields = {
  name: z.string().trim().min(1).max(80),
  priceCredits: z.number().int().min(1).openapi({ description: 'Integer credits, never VND' }),
  stock: z.number().int().min(0),
  available: z.boolean(),
};

export const createSnackSchema = z
  .object({ ...snackFields, available: snackFields.available.default(true) })
  .openapi('ExampleCreateSnackDto');
export type CreateSnackDto = z.infer<typeof createSnackSchema>;

export const updateSnackSchema = z.object(snackFields).partial().openapi('ExampleUpdateSnackDto');
export type UpdateSnackDto = z.infer<typeof updateSnackSchema>;

export const buySnackSchema = z.object({ quantity: z.number().int().min(1).max(20) });
export type BuySnackDto = z.infer<typeof buySnackSchema>;

/** ?page&pageSize&from&to&q&available */
export const listSnacksQuery = z.object({
  ...pageQuery.shape,
  ...dateRangeQuery.shape,
  q: z
    .string()
    .trim()
    .min(1)
    .optional()
    .openapi({ description: 'Name contains, case-insensitive' }),
  // Query strings are text: z.stringbool() reads "true"/"false" (also 1/0, yes/no).
  available: z.stringbool().optional(),
});
export type ListSnacksQuery = z.infer<typeof listSnacksQuery>;
