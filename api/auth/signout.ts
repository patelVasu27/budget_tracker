import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAuth } from '../_lib/auth'
import { clearSessionCookies, sendSuccess } from '../_lib/errors'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    await supabaseAuth.auth.signOut()
  } catch {
    // Ignore errors on sign out - we still clear cookies
  }

  clearSessionCookies(res)
  return sendSuccess(res, { success: true })
}