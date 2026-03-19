import { API_BASE_URL } from './config'
import { keycloak } from '../keycloak'

function getAuthHeaders(): Record<string, string> {
  const token = keycloak.token
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const headers = new Headers(init.headers)
  const auth = getAuthHeaders()
  for (const [k, v] of Object.entries(auth)) headers.set(k, v)

  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  let res = await fetch(url, { ...init, headers })

  if (res.status === 401 && keycloak.authenticated) {
    try {
      const refreshed = await keycloak.updateToken(30)
      if (refreshed) {
        headers.set('Authorization', `Bearer ${keycloak.token}`)
        res = await fetch(url, { ...init, headers })
      }
    } catch {
      /* token refresh failed — return original 401 */
    }
  }

  return res
}

export async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string; code?: string }
    throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`, body.code)
  }
  return res.json() as Promise<T>
}
