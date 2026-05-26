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

    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        token: stored.token,
        refreshToken: stored.refreshToken,
        checkLoginIframe: false,
      })
      .then(() => {
        if (keycloak.authenticated && keycloak.token) {
          localStorage.setItem(KC_TOKEN_KEY, keycloak.token)
          if (keycloak.refreshToken) localStorage.setItem(KC_REFRESH_KEY, keycloak.refreshToken)
          setAuthCookie()
        } else {
          clearAuthCookie()
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
            window.location.replace('/')
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
        if (msg.includes('Timeout') || msg.includes('3rd party')) {
          console.warn('[keycloak] init silenced (expected in restrictive browser environments):', msg)
          return
        }
        console.error('[keycloak] init failed:', err)
      })

    const forceRelogin = () => {
      localStorage.removeItem(KC_TOKEN_KEY)
      localStorage.removeItem(KC_REFRESH_KEY)
      clearAuthCookie()
      window.location.replace('/')
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
