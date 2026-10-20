import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withAuth } from '../_lib/auth'
import { validateBody, MonthlySettingsSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { supabaseAdmin } from '../_lib/db'

async function handler(req: VercelRequest, res: VercelResponse, userId: string): Promise<void> {
  if (req.method === 'GET') {
    const month = req.query.month as string
    const year = req.query.year as string

    if (!month || !year) {
      return sendError(res, 400, 'month and year query parameters are required')
    }

    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)

    try {
      const { data, error } = await supabaseAdmin
        .from('monthly_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('month', monthNum)
        .eq('year', yearNum)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return sendSuccess(res, data || null)
    } catch (err) {
      console.error('Get monthly settings error:', err)
      return sendError(res, 500, 'Failed to load monthly settings')
    }
  }

  if (req.method === 'PUT') {
    const validation = validateBody(MonthlySettingsSchema, req.body)
    if (!validation.success) {
      return sendError(res, 400, 'Validation failed', 'VALIDATION_ERROR')
    }

    const { income, month, year } = validation.data

    try {
      // Try upsert
      const { data, error } = await supabaseAdmin
        .from('monthly_settings')
        .upsert(
          {
            user_id: userId,
            income,
            month,
            year,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,month,year' }
        )
        .select()
        .single()

      if (error) throw error

      return sendSuccess(res, data)
    } catch (err) {
      console.error('Upsert monthly settings error:', err)
      return sendError(res, 500, 'Failed to save monthly settings')
    }
  }

  return sendError(res, 405, 'Method not allowed')
}

export default withAuth(handler)