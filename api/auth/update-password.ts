import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAuth } from '../_lib/auth'
import { validateBody, UpdatePasswordSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'
import { verifyAuth } from '../_lib/auth'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed')
  }

  const auth = await verifyAuth(req)
  if (!auth) {
    return sendError(res, 401, 'Unauthorized')
  }

  const validation = validateBody(UpdatePasswordSchema, req.body)
  if (!validation.success) {
    return sendError(res, validation.response.status, 'Validation failed', 'VALIDATION_ERROR')
  }

  const { password } = validation.data

  try {
    const { error } = await supabaseAuth.auth.updateUser({
      password,
    })

    if (error) {
      return sendError(res, 400, 'Failed to update password')
    }

    return sendSuccess(res, { success: true })
  } catch (err) {
    console.error('Update password error:', err)
    return sendError(res, 500, 'Failed to update password')
  }
}