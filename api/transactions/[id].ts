import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, UpdateTransactionSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  const { id } = req.query as { id: string }

  if (!id || typeof id !== 'string') {
    return sendError(res, 400, 'Invalid transaction ID')
  }

  if (req.method === 'PUT') {
    const validation = validateBody(UpdateTransactionSchema, req.body)
    if (!validation.success) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
    }

    const { amount, type, category, category_id, note, date } = validation.data

    const updateData: Record<string, unknown> = {}
    if (amount !== undefined) updateData.amount = amount
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (category_id !== undefined) updateData.category_id = category_id
    if (note !== undefined) updateData.note = note
    if (date !== undefined) updateData.date = date

    try {
      const { data, error } = await supabaseAdmin
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error
      if (!data) return sendError(res, 404, 'Transaction not found')

      return sendSuccess(res, data)
    } catch (err) {
      console.error('Update transaction error:', err)
      return sendError(res, 500, 'Failed to update transaction')
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error

      return sendSuccess(res, { success: true })
    } catch (err) {
      console.error('Delete transaction error:', err)
      return sendError(res, 500, 'Failed to delete transaction')
    }
  }

  return sendError(res, 405, 'Method not allowed')
}

export default withAuth(handler)