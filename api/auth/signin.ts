import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAuth } from '../_lib/auth'
import { validateBody, SigninSchema } from '../_lib/validate'
import { sendError, sendSuccess } from '../_lib/errors'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed')
  }

  const validation = validateBody(SigninSchema, req.body)
  if (!validation.success) {
    return sendError(res, validation.response.status, 'Validation failed', 'VALIDATION_ERROR')
  }

  const { email, password } = validation.data

  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session || !data.user) {
      // Generic error to prevent enumeration
      return sendError(res, 401, 'Invalid email or password')
    }

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
    })
  } catch (err) {
    console.error('Signin error:', err)
    return sendError(res, 500, 'Sign in failed. Please try again.')
  }
}