import type { VercelRequest, VercelResponse } from '@vercel/node'
import { verifyAuth } from '../_lib/auth'
import { sendError, sendSuccess } from '../_lib/errors'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed')
  }

  const auth = await verifyAuth(req)
  if (!auth) {
    return sendError(res, 401, 'Unauthorized')
  }

  return sendSuccess(res, {
    user: { id: auth.userId },
    authenticated: true,
  })
}