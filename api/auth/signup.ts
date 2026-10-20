import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAuth } from '../_lib/auth'
import { supabaseAdmin } from '../_lib/db'
import { validateBody, SignupSchema } from '../_lib/validate'
import { sendError, sendSuccess, ApiError } from '../_lib/errors'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed')
  }

  const validation = validateBody(SignupSchema, req.body)
  if (!validation.success) {
    return sendError(res, validation.response.status, 'Validation failed', 'VALIDATION_ERROR')
  }

  const { email, password } = validation.data

  try {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
    })

    if (error) {
      // Don't reveal whether email exists - generic error
      return sendError(res, 400, 'Sign up failed. Please try again.')
    }

    if (!data.user) {
      return sendError(res, 500, 'Sign up failed. Please try again.')
    }

    // If email confirmation is required, data.session will be null
    // If not, we have a session and should set cookies
    if (data.session) {
      const { access_token, refresh_token } = data.session
      res.setHeader(
        'Set-Cookie',
        [
          `sb-session=${access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
          `sb-refresh=${refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
        ]
      )
      return sendSuccess(res, {
        user: { id: data.user.id, email: data.user.email },
        session: {
          access_token,
          refresh_token,
          expires_at: data.session.expires_at,
        },
        email_confirmation_required: false,
      })
    }

    return sendSuccess(res, {
      user: { id: data.user.id, email: data.user.email },
      session: null,
      email_confirmation_required: true,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return sendError(res, 500, 'Sign up failed. Please try again.')
  }
}