import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, ReorderCategoriesSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  if (req.method !== 'PUT') {
    return sendError(res, 405, 'Method not allowed')
  }

  const validation = validateBody(ReorderCategoriesSchema, req.body)
  if (!validation.success) {
    return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
  }

  const { ordered } = validation.data

  try {
    for (const item of ordered) {
      const { error } = await supabaseAdmin
        .from('categories')
        .update({ sort_order: item.sort_order })
        .eq('id', item.id)
        .eq('user_id', userId)

      if (error) throw error
    }

    return sendSuccess(res, { success: true })
  } catch (err) {
    console.error('Reorder categories error:', err)
    return sendError(res, 500, 'Failed to reorder categories')
  }
}

export default withAuth(handler)