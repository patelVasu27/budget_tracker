import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAuth } from '../_lib/auth'
import { validateBody, ResetPasswordSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed')
  }

  const validation = validateBody(ResetPasswordSchema, req.body)
  if (!validation.success) {
    return sendError(res, validation.response.status, 'Validation failed', 'VALIDATION_ERROR')
  }

  const { email } = validation.data

  try {
    const siteUrl = process.env.SITE_URL || 'https://budgetpulse.vercel.app'
    const { error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/`,
    })

    // Always return success to prevent email enumeration
    if (error) {
      console.error('Reset password error:', error)
    }

    return sendSuccess(res, {
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    })
  } catch (err) {
    console.error('Reset password error:', err)
    // Still return success to prevent enumeration
    return sendSuccess(res, {
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    })
  }
}