import { API_BASE_URL } from './config'

//
// The HTTP client is decoupled from Keycloak: it works with any token source.
// Call `configureApiAuth` once at application bootstrap (see main.tsx).
//
// NOTE: Bearer tokens are no longer injected here — the BFF proxy at
// app/api/[...path]/route.ts reads the session cookie server-side and adds the
// Authorization header. configureApiAuth is retained for onUnauthenticated.

interface ApiAuthProvider {
  getToken: () => string | undefined
  isAuthenticated: () => boolean
  refreshToken: () => Promise<boolean>
  /** Called when 401 is received and session is dead. */
  onUnauthenticated?: () => void
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

//
// Authorization: Bearer is added server-side by the BFF proxy.
// Cookies (__session) are sent automatically by the browser (same-origin).

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(url, { ...init, headers, redirect: 'manual' })

  // Middleware redirect (e.g. RefreshTokenError) — treat as 401
  if (res.type === 'opaqueredirect') {
    _auth.onUnauthenticated?.()
    return new Response(null, { status: 401 })
  }

  // 401 from proxy means session expired — trigger re-login
  if (res.status === 401) {
    _auth.onUnauthenticated?.()
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

/** 204 No Content or empty body — success without JSON. */
export async function emptyOrThrow(res: Response): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; message?: string; code?: string }
    throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`, body.code)
  }
}
