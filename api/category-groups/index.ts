import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, CategoryGroupSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('category_groups')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return sendSuccess(res, (data as any[]) || [])
    } catch (err) {
      console.error('List category groups error:', err)
      return sendError(res, 500, 'Failed to load category groups')
    }
  }

  if (req.method === 'POST') {
    const validation = validateBody(CategoryGroupSchema, req.body)
    if (!validation.success) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
    }

    const { name } = validation.data

    try {
      const { data: lastGroup } = await supabaseAdmin
        .from('category_groups')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      const sort_order = (lastGroup?.sort_order ?? 0) + 1

      const { data: group, error } = await supabaseAdmin
        .from('category_groups')
        .insert({
          user_id: userId,
          name,
          sort_order,
        })
        .select()
        .single()

      if (error) throw error

      return sendSuccess(res, group)
    } catch (err) {
      console.error('Create category group error:', err)
      return sendError(res, 500, 'Failed to create category group')
    }
  }

  return sendError(res, 405, 'Method not allowed')
}

export default withAuth(handler)