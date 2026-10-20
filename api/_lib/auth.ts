import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendError } from './errors'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  )
}

/**
 * Admin client for verifying JWTs and managing sessions server-side.
 * Uses service-role key but does NOT bypass RLS for user queries -
 * we pass the user's JWT to Postgres so RLS stays active.
 */
export const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Verifies a Supabase JWT from the sb-session cookie.
 * Returns the user_id (sub claim) if valid, null otherwise.
 */
export async function verifyAuth(
  req: VercelRequest
): Promise<{ userId: string } | null> {
  const token = req.cookies?.['sb-session']
  if (!token) return null

  try {
    const { data, error } = await supabaseAuth.auth.getUser(token)
    if (error || !data?.user) return null

    return { userId: data.user.id }
  } catch {
    return null
  }
}

/**
 * Sets the session cookies on the response.
 * sb-session: access token (HttpOnly, Secure, SameSite=Lax)
 * sb-refresh: refresh token (HttpOnly, Secure, SameSite=Lax)
 */
export function setSessionCookies(
  res: VercelResponse,
  accessToken: string,
  refreshToken: string
): void {
  res.setHeader(
    'Set-Cookie',
    [
      `sb-session=${accessToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
      `sb-refresh=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`,
    ]
  )
}

/**
 * Clears session cookies on sign out.
 */
export function clearSessionCookies(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    [
      'sb-session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
      'sb-refresh=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0',
    ]
  )
}

/**
 * Attempts to refresh an expired access token using the refresh token.
 * Returns the new tokens or null if refresh failed.
 */
export async function refreshAccessToken(
  refreshToken: string | undefined
): Promise<{ accessToken: string; refreshToken: string } | null> {
  if (!refreshToken) return null

  try {
    const { data, error } = await supabaseAuth.auth.refreshSession({
      refresh_token: refreshToken,
    })
    if (error || !data?.session) return null

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }
  } catch {
    return null
  }
}

/**
 * Middleware wrapper that verifies auth before calling the handler.
 * Sets new session cookies if a refresh occurred.
 */
export function withAuth(
  handler: (
    req: VercelRequest,
    res: VercelResponse,
    userId: string
  ) => Promise<void> | void
) {
  return async (req: VercelRequest, res: VercelResponse): Promise<void> => {
    const auth = await verifyAuth(req)

    if (!auth) {
      clearSessionCookies(res)
      return sendError(res, 401, 'Unauthorized')
    }

    // Check if we need to refresh the token
    const token = req.cookies?.['sb-session']
    const refreshToken = req.cookies?.['sb-refresh']

    if (token) {
      try {
        // Quick check if token is expired by trying to get user
        const { data, error } = await supabaseAuth.auth.getUser(token)
        if (error && error.message.includes('expired')) {
          const refreshed = await refreshAccessToken(refreshToken)
          if (refreshed) {
            setSessionCookies(res, refreshed.accessToken, refreshed.refreshToken)
          } else {
            clearSessionCookies(res)
            return sendError(res, 401, 'Session expired. Please sign in again.')
          }
        }
      } catch {
        // Token verification failed, try refresh
        const refreshed = await refreshAccessToken(refreshToken)
        if (!refreshed) {
          clearSessionCookies(res)
          return sendError(res, 401, 'Unauthorized')
        }
        setSessionCookies(res, refreshed.accessToken, refreshed.refreshToken)
      }
    }

    return handler(req, res, auth.userId)
  }
}