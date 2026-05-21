'use client'

import { type ReactNode, useEffect } from 'react'
import { configureApiAuth } from '@/api/client'
import { keycloak } from '@/lib/keycloak'

function setAuthCookie() {
  document.cookie = 'inktide_auth=1; path=/; SameSite=Lax; max-age=86400'
}

function clearAuthCookie() {
  document.cookie = 'inktide_auth=; path=/; SameSite=Lax; max-age=0'
}

let initialized = false

export function KeycloakBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (initialized) return
    initialized = true

    const stored = {
      token: localStorage.getItem('inktide_kc_token') ?? undefined,
      refreshToken: localStorage.getItem('inktide_kc_refresh') ?? undefined,
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
          localStorage.setItem('inktide_kc_token', keycloak.token)
          if (keycloak.refreshToken) localStorage.setItem('inktide_kc_refresh', keycloak.refreshToken)
          setAuthCookie()
        } else {
          clearAuthCookie()
        }

        keycloak.onTokenExpired = () => {
          keycloak.updateToken(60).then(() => {
            if (keycloak.token) {
              localStorage.setItem('inktide_kc_token', keycloak.token)
              if (keycloak.refreshToken) localStorage.setItem('inktide_kc_refresh', keycloak.refreshToken)
              setAuthCookie()
            }
          }).catch(() => {
            localStorage.removeItem('inktide_kc_token')
            localStorage.removeItem('inktide_kc_refresh')
            clearAuthCookie()
            keycloak.login({ redirectUri: window.location.href })
          })
        }

        keycloak.onAuthLogout = () => {
          localStorage.removeItem('inktide_kc_token')
          localStorage.removeItem('inktide_kc_refresh')
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
      localStorage.removeItem('inktide_kc_token')
      localStorage.removeItem('inktide_kc_refresh')
      clearAuthCookie()
      keycloak.login({ redirectUri: window.location.href })
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
