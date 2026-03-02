/**
 * Current user API (requires Bearer token)
 */

import { apiFetch } from './client'
import { type ApiError } from './types'

export interface MeResponse {
  userId: string
  userName: string
  role: string
}

/**
 * Fetch current user from /api/me. Uses Bearer token, retries on 401 after refresh.
 */
export async function getMe(): Promise<MeResponse> {
  const res = await apiFetch('/api/me', { method: 'GET' })
  const data = await res.json().catch(() => ({})) as MeResponse | ApiError

  if (!res.ok) {
    const err = data as ApiError
    throw new Error(err.error ?? 'Не удалось загрузить профиль')
  }

  return data as MeResponse
}
