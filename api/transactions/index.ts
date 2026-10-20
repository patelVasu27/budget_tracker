import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, CreateTransactionSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  if (req.method === 'GET') {
    const startDate = req.query.start as string
    const endDate = req.query.end as string
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined

    if (!startDate || !endDate) {
      return sendError(res, 400, 'start and end query parameters are required')
    }

    try {
      let query = supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (limit && limit > 0) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      // Secondary sort by created_at desc
      const rows = (data as any[]) || []
      rows.sort((a, b) => {
        const dateDiff = b.date.localeCompare(a.date)
        if (dateDiff !== 0) return dateDiff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      return sendSuccess(res, rows)
    } catch (err) {
      console.error('List transactions error:', err)
      return sendError(res, 500, 'Failed to load transactions')
    }
  }

  if (req.method === 'POST') {
    const validation = validateBody(CreateTransactionSchema, req.body)
    if (!validation.success) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
    }

    const { amount, type, category, category_id, note, date } = validation.data

    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          amount,
          type,
          category,
          category_id,
          note,
          date,
        })
        .select()
        .single()

      if (error) throw error

      return sendSuccess(res, data)
    } catch (err) {
      console.error('Create transaction error:', err)
      return sendError(res, 500, 'Failed to create transaction')
    }
  }

  return sendError(res, 405, 'Method not allowed')
}

export default withAuth(handler)