import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, CategoryGroupSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  const { id } = req.query as { id: string }

  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'Invalid category group ID')
  }

  if (req.method === 'PUT') {
    const validation = validateBody(CategoryGroupSchema, req.body)
    if (!validation.success) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
    }

    const { name } = validation.data

    try {
      const { data, error } = await supabaseAdmin
        .from('category_groups')
        .update({ name })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      if (!data) return sendError(res, 404, 'Category group not found')

      return sendSuccess(res, data)
    } catch (err) {
      console.error('Update category group error:', err)
      return sendError(res, 500, 'Failed to update category group')
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('category_groups')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error

      return sendSuccess(res, { success: true })
    } catch (err) {
      console.error('Delete category group error:', err)
      return sendError(res, 500, 'Failed to delete category group')
    }
  }

  return sendError(res, 405, 'Method not allowed')
}

export default withAuth(handler)