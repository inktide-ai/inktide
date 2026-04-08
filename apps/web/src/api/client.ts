import { API_BASE_URL } from './config'

// ── Auth provider ─────────────────────────────────────────────────────────────
//
// The HTTP client is decoupled from Keycloak: it works with any token source.
// Call `configureApiAuth` once at application bootstrap (see main.tsx).

interface ApiAuthProvider {
  getToken: () => string | undefined
  isAuthenticated: () => boolean
  refreshToken: () => Promise<boolean>
}

const noopAuth: ApiAuthProvider = {
  getToken: () => undefined,
  isAuthenticated: () => false,
  refreshToken: async () => false,
}

let _auth: ApiAuthProvider = noopAuth

export function configureApiAuth(provider: ApiAuthProvider): void {
  _auth = provider
}

// ── Errors ────────────────────────────────────────────────────────────────────

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

// ── Core fetch ────────────────────────────────────────────────────────────────

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const headers = new Headers(init.headers)
  const token = _auth.getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  let res = await fetch(url, { ...init, headers })

  if (res.status === 401 && _auth.isAuthenticated()) {
    try {
      const refreshed = await _auth.refreshToken()
      if (refreshed) {
        const newToken = _auth.getToken()
        if (newToken) headers.set('Authorization', `Bearer ${newToken}`)
        res = await fetch(url, { ...init, headers })
      }
    } catch {
      /* token refresh failed — return original 401 */
    }
  }

  return res
}

// ── Response helpers ──────────────────────────────────────────────────────────

export async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string; code?: string }
    throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`, body.code)
  }
  return res.json() as Promise<T>
}

/** 204 No Content or empty body — success without JSON. */
export async function emptyOrThrow(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string; code?: string }
    throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`, body.code)
  }
}
