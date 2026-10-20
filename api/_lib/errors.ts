import type { VercelResponse } from '@vercel/node'

export interface ErrorResponse {
  error: string
  code?: string
}

export function sendError(
  res: VercelResponse,
  status: number,
  message: string,
  code?: string
): void {
  const body: ErrorResponse = { error: message }
  if (code) body.code = code
  res.status(status).json(body)
}

export function sendSuccess(res: VercelResponse, data: unknown): void {
  res.status(200).json(data)
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}