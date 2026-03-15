/**
 * Auth API
 */

import { API_BASE_URL } from './config'
import { type ApiError, STORAGE_KEYS } from './types'

export interface LoginRequest {
  email?: string
  username?: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshToken?: string
  refreshExpiresIn?: number
}

export async function login(
  credentials: LoginRequest
): Promise<LoginResponse> {
  const body: Record<string, string> = {
    password: credentials.password,
  }
  if (credentials.email) body.email = credentials.email
  if (credentials.username) body.username = credentials.username

  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = await res.json().catch(() => ({})) as LoginResponse | ApiError

  if (!res.ok) {
    const err = data as ApiError
    throw new Error(err.error ?? 'Login failed')
  }

  return data as LoginResponse
}

export interface RegisterRequest {
  email: string
  password: string
  displayName?: string
}

export async function register(
  data: RegisterRequest
): Promise<LoginResponse> {
  const body: Record<string, string> = {
    email: data.email.trim().toLowerCase(),
    password: data.password,
  }
  if (data.displayName?.trim()) {
    body.displayName = data.displayName.trim()
  }

  const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const responseData = await res.json().catch(() => ({})) as LoginResponse | ApiError

  if (!res.ok) {
    const err = responseData as ApiError
    throw new Error(err.error ?? 'Registration failed')
  }

  return responseData as LoginResponse
}

/**
 * Request password reset email.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })

  const data = await res.json().catch(() => ({})) as ApiError | { message?: string }

  if (!res.ok) {
    const err = data as ApiError
    throw new Error(err.error ?? 'Failed to send reset email')
  }
}

/**
 * Exchange refresh token for new access token. Updates localStorage on success.
 * @returns true if refresh succeeded, false otherwise
 */
export async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  if (!refreshToken) return false

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const data = await res.json().catch(() => ({})) as LoginResponse | ApiError

  if (!res.ok) return false

  const loginRes = data as LoginResponse
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginRes.accessToken)
  if (loginRes.refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginRes.refreshToken)
  }
  return true
}
