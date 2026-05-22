import { API_BASE_URL } from './config'

// ── Auth provider ─────────────────────────────────────────────────────────────
//
// The HTTP client is decoupled from Keycloak: it works with any token source.
// Call `configureApiAuth` once at application bootstrap (see main.tsx).

interface ApiAuthProvider {
  getToken: () => string | undefined
  isAuthenticated: () => boolean
  refreshToken: () => Promise<boolean>
  /** Called when 401 is received and token refresh also fails — session is dead. */
  onUnauthenticated?: () => void
}

const noopAuth: ApiAuthProvider = {
  getToken: () => undefined,
  isAuthenticated: () => false,
  refreshToken: async () => false,
}

let _auth: ApiAuthProvider = noopAuth
let _bootstrapped = false

export function configureApiAuth(provider: ApiAuthProvider): void {
  _auth = provider
  _bootstrapped = true
}

/**
 * @deprecated Use {@link getFreshAuthToken} — returns a potentially-stale token with no refresh.
 * All production callers (SignalR, fetch) must use getFreshAuthToken instead.
 */
export function getAuthToken(): string | undefined {
  return _auth.getToken()
}

/** Refresh if expiring soon, then return the current token. Safe to call from SignalR accessTokenFactory. */
export async function getFreshAuthToken(): Promise<string> {
  await _auth.refreshToken().catch(() => {})
  return _auth.getToken() ?? ''
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
  if (!_bootstrapped) {
    throw new Error('apiFetch called before configureApiAuth — ensure KeycloakBootstrap has completed')
  }
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
      } else {
        // Refresh token rejected — session is dead (e.g. Docker restart wiped Keycloak).
        // Trigger re-login so the user isn't stuck on an infinite loading screen.
        _auth.onUnauthenticated?.()
      }
    } catch {
      _auth.onUnauthenticated?.()
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
