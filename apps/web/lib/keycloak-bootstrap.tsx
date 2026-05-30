'use client'

import { type ReactNode, useEffect, useRef } from 'react'
import { configureApiAuth } from '@/api/client'
import { keycloak } from '@/lib/keycloak'

function setAuthCookie() {
  document.cookie = 'inktide_auth=1; path=/; SameSite=Lax; max-age=86400'
}

function clearAuthCookie() {
  document.cookie = 'inktide_auth=; path=/; SameSite=Lax; max-age=0'
}

const KC_TOKEN_KEY = 'v1_inktide_kc_token'
const KC_REFRESH_KEY = 'v1_inktide_kc_refresh'

export function KeycloakBootstrap({ children }: { children: ReactNode }) {
  const initializedRef = useRef(false)
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // one-time migration from unversioned keys — preserves existing sessions on upgrade
    for (const [oldKey, newKey] of [['inktide_kc_token', KC_TOKEN_KEY], ['inktide_kc_refresh', KC_REFRESH_KEY]] as const) {
      const v = localStorage.getItem(oldKey)
      if (v && !localStorage.getItem(newKey)) localStorage.setItem(newKey, v)
      localStorage.removeItem(oldKey)
    }

    const stored = {
      token: localStorage.getItem(KC_TOKEN_KEY) ?? undefined,
      refreshToken: localStorage.getItem(KC_REFRESH_KEY) ?? undefined,
    }

    const initPromise = keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      token: stored.token,
      refreshToken: stored.refreshToken,
      checkLoginIframe: false,
    })

    // If Keycloak is restarting, the silent-SSO iframe hangs indefinitely.
    // Race with a 6s timeout so we can redirect to login instead of spinning forever.
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Keycloak init timeout')), 6000),
    )

    Promise.race([initPromise, timeoutPromise])
      .then(() => {
        if (keycloak.authenticated && keycloak.token) {
          localStorage.setItem(KC_TOKEN_KEY, keycloak.token)
          if (keycloak.refreshToken) localStorage.setItem(KC_REFRESH_KEY, keycloak.refreshToken)
          setAuthCookie()
        } else {
          clearAuthCookie()
          // Had stored tokens but Keycloak says not authenticated → stale session (e.g. server restart)
          if (stored.token || stored.refreshToken) {
            localStorage.removeItem(KC_TOKEN_KEY)
            localStorage.removeItem(KC_REFRESH_KEY)
            keycloak.login()
            return
          }
        }

        keycloak.onTokenExpired = () => {
          keycloak.updateToken(60).then(() => {
            if (keycloak.token) {
              localStorage.setItem(KC_TOKEN_KEY, keycloak.token)
              if (keycloak.refreshToken) localStorage.setItem(KC_REFRESH_KEY, keycloak.refreshToken)
              setAuthCookie()
            }
          }).catch(() => {
            localStorage.removeItem(KC_TOKEN_KEY)
            localStorage.removeItem(KC_REFRESH_KEY)
            clearAuthCookie()
            keycloak.login()
          })
        }

        keycloak.onAuthLogout = () => {
          localStorage.removeItem(KC_TOKEN_KEY)
          localStorage.removeItem(KC_REFRESH_KEY)
          clearAuthCookie()
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        // 3rd-party cookie block: Keycloak IS available but browser blocks the SSO iframe.
        // Redirecting to login would succeed, but keep this silent to avoid noise on public pages.
        if (msg.includes('3rd party')) {
          console.warn('[keycloak] init silenced (3rd-party cookie restriction):', msg)
          return
        }
        // All other errors (including Timeout when Keycloak is restarting):
        // clear stale tokens and redirect to login.
        // Loop guard: if Keycloak is fully down, stop after one attempt for 10s.
        console.error('[keycloak] init failed:', err)
        localStorage.removeItem(KC_TOKEN_KEY)
        localStorage.removeItem(KC_REFRESH_KEY)
        clearAuthCookie()
        const lastAttempt = sessionStorage.getItem('kc_login_attempt')
        if (lastAttempt && Date.now() - parseInt(lastAttempt) < 10_000) {
          console.error('[keycloak] Keycloak unavailable — stopping redirect loop')
          return
        }
        sessionStorage.setItem('kc_login_attempt', Date.now().toString())
        keycloak.login()
      })

    const forceRelogin = () => {
      localStorage.removeItem(KC_TOKEN_KEY)
      localStorage.removeItem(KC_REFRESH_KEY)
      clearAuthCookie()
      keycloak.login()
    }

    configureApiAuth({
      getToken: () => keycloak.token,
      isAuthenticated: () => keycloak.authenticated ?? false,
      refreshToken: () => keycloak.updateToken(60).then(() => true).catch(() => false),
      onUnauthenticated: forceRelogin,
    })
  }, [])

  return <>{children}</>
}
