import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, CategorySchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error

      return sendSuccess(res, (data as any[]) || [])
    } catch (err) {
      console.error('List categories error:', err)
      return sendError(res, 500, 'Failed to load categories')
    }
  }

  if (req.method === 'POST') {
    const validation = validateBody(CategorySchema, req.body)
    if (!validation.success) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
    }

    const { name, type, group_id, icon, color } = validation.data

    try {
      // Get max sort_order for this user
      const { data: lastCat } = await supabaseAdmin
        .from('categories')
        .select('sort_order')
        .eq('user_id', userId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

      const sort_order = (lastCat?.sort_order ?? 0) + 1

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .insert({
          user_id: userId,
          name,
          type,
          group_id,
          icon,
          color,
          sort_order,
        })
        .select()
        .single()

      if (error) throw error

      return sendSuccess(res, category)
    } catch (err) {
      console.error('Create category error:', err)
      return sendError(res, 500, 'Failed to create category')
    }
  }

  return sendError(res, 405, 'Method not allowed')
}

export default withAuth(handler)