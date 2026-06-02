'use client'

import { keycloak } from './keycloak'

// ── constants ──────────────────────────────────────────────────────────────────

const TOKEN_KEY    = 'v1_inktide_kc_token'
const REFRESH_KEY  = 'v1_inktide_kc_refresh'
const LOOP_KEY     = 'kc_login_attempt'
const LOOP_GUARD   = 10_000  // ms — stop redirect loop if Keycloak is down
const INIT_TIMEOUT = 6_000   // ms — silent SSO iframe can hang indefinitely

// ── token storage ──────────────────────────────────────────────────────────────

function storedTokens(): { token?: string; refreshToken?: string } {
  return {
    token:        localStorage.getItem(TOKEN_KEY)   ?? undefined,
    refreshToken: localStorage.getItem(REFRESH_KEY) ?? undefined,
  }
}

function persistCurrentTokens(): void {
  if (keycloak.token)        localStorage.setItem(TOKEN_KEY,   keycloak.token)
  if (keycloak.refreshToken) localStorage.setItem(REFRESH_KEY, keycloak.refreshToken)
}

function clearTokenStorage(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// ── legacy key migration ───────────────────────────────────────────────────────

function migrateTokenKeys(): void {
  for (const [oldKey, newKey] of [
    ['inktide_kc_token',   TOKEN_KEY],
    ['inktide_kc_refresh', REFRESH_KEY],
  ] as const) {
    const v = localStorage.getItem(oldKey)
    if (v && !localStorage.getItem(newKey)) localStorage.setItem(newKey, v)
    localStorage.removeItem(oldKey)
  }
}

// ── auth cookie ───────────────────────────────────────────────────────────────

function setAuthCookie(): void {
  document.cookie = 'inktide_auth=1; path=/; SameSite=Lax; max-age=86400'
}

function clearAuthCookie(): void {
  document.cookie = 'inktide_auth=; path=/; SameSite=Lax; max-age=0'
}

// ── composite session clear ───────────────────────────────────────────────────

export function clearSession(): void {
  clearTokenStorage()
  clearAuthCookie()
}

// ── redirect loop guard ───────────────────────────────────────────────────────

function redirectToLogin(): void {
  const last = sessionStorage.getItem(LOOP_KEY)
  if (last && Date.now() - parseInt(last, 10) < LOOP_GUARD) {
    console.error('[keycloak] server unavailable — loop guard active')
    return
  }
  sessionStorage.setItem(LOOP_KEY, String(Date.now()))
  keycloak.login()
}

// ── session event handlers ────────────────────────────────────────────────────

function registerSessionHandlers(): void {
  keycloak.onTokenExpired = () => {
    keycloak.updateToken(60)
      .then(() => { persistCurrentTokens(); setAuthCookie() })
      .catch(() => { clearSession(); keycloak.login() })
  }
  keycloak.onAuthLogout = () => clearSession()
}

// ── main init ─────────────────────────────────────────────────────────────────

export async function initKeycloakSession(): Promise<void> {
  migrateTokenKeys()
  const stored = storedTokens()

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Keycloak init timeout')), INIT_TIMEOUT)
  })

  try {
    await Promise.race([
      keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe: false,
        ...stored,
      }),
      timeout,
    ])
  } catch (err) {
    clearTimeout(timeoutId)
    const msg = err instanceof Error ? err.message : String(err)
    if (/3rd.party|third.party/i.test(msg)) {
      console.warn('[keycloak] 3rd-party cookie restriction, skipping silent SSO:', msg)
      return
    }
    console.error('[keycloak] init failed:', err)
    clearSession()
    redirectToLogin()
    return
  }
  clearTimeout(timeoutId)

  registerSessionHandlers()

  if (keycloak.authenticated && keycloak.token) {
    persistCurrentTokens()
    setAuthCookie()
  } else if (stored.token || stored.refreshToken) {
    clearSession()
    redirectToLogin()
  } else {
    clearAuthCookie()
  }
}
