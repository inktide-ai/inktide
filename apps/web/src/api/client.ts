/**
 * API client with Bearer token and 401 -> refresh -> retry
 * Uses Keycloak token when available, else localStorage (legacy backend auth).
 */

import { API_BASE_URL } from './config'
import { refreshTokens } from './auth'
import { STORAGE_KEYS } from './types'
import { keycloak } from '../keycloak'

function getAuthHeaders(): Record<string, string> {
  const token = keycloak.token ?? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export interface ApiClientOptions {
  /** Retry request once after refresh on 401. Default: true for authenticated requests */
  retryOn401?: boolean
}

/**
 * Authenticated fetch. Adds Bearer token. On 401, attempts refresh and retries once.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {}
): Promise<Response> {
  const { retryOn401 = true } = options
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const headers = new Headers(init.headers)
  const auth = getAuthHeaders()
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v))
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  let res = await fetch(url, { ...init, headers })

  if (res.status === 401 && retryOn401 && auth.Authorization) {
    let refreshed = false
    if (keycloak.authenticated) {
      try {
        refreshed = await keycloak.updateToken(30)
      } catch {
        refreshed = false
      }
    }
    if (!refreshed) {
      refreshed = await refreshTokens()
    }
    if (refreshed) {
      const newAuth = getAuthHeaders()
      Object.entries(newAuth).forEach(([k, v]) => headers.set(k, v))
      res = await fetch(url, { ...init, headers })
    }
  }

  return res
}
