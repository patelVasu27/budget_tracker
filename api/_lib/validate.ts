import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative'),
  type: z.enum(['expense', 'income']),
  category: z.string().min(1).max(32),
  category_id: z.string().uuid().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
})

export const UpdateTransactionSchema = z.object({
  amount: z.number().min(0).optional(),
  type: z.enum(['expense', 'income']).optional(),
  category: z.string().min(1).max(32).optional(),
  category_id: z.string().uuid().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export const MonthlySettingsSchema = z.object({
  income: z.number().min(0),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
})

export const CategorySchema = z.object({
  name: z.string().min(1).max(32),
  type: z.enum(['expense', 'income']),
  group_id: z.string().uuid().nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
  color: z.string().max(20).nullable().optional(),
})

export const CategoryGroupSchema = z.object({
  name: z.string().min(1).max(32),
})

export const ReorderCategoriesSchema = z.object({
  ordered: z.array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().nonnegative(),
    })
  ),
})

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const SigninSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
})

export const UpdatePasswordSchema = z.object({
  password: z.string().min(6),
})

/**
 * Validates request body against a Zod schema.
 * Returns parsed data or sends a 400 error response.
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; response: { status: number; body: unknown } } {
  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      success: false,
      response: {
        status: 400,
        body: { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      },
    }
  }
  return { success: true, data: result.data }
}