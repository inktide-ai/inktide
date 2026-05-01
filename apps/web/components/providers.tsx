'use client'

import { type ReactNode, useEffect, useState } from 'react'
import Keycloak from 'keycloak-js'
import { AuthProvider } from '@/context/AuthContext'
import { KeycloakTokenParser } from '@/services/auth/KeycloakTokenParser'
import { KeycloakLocaleSync } from '@/services/auth/KeycloakLocaleSync'
import { MeAvatarService } from '@/services/auth/MeAvatarService'
import { configureApiAuth } from '@/api/client'
import { initI18n } from '@/i18n/i18n'

const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inktide-app',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'inktide-web',
})

const tokenParser = new KeycloakTokenParser()
const localeSync = new KeycloakLocaleSync()
const avatarService = new MeAvatarService()

function setAuthCookie() {
  document.cookie = 'inktide_auth=1; path=/; SameSite=Lax; max-age=86400'
}

function clearAuthCookie() {
  document.cookie = 'inktide_auth=; path=/; SameSite=Lax; max-age=0'
}

let initialized = false

function KeycloakBootstrap({ children }: { children: ReactNode }) {
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
          })
        }

        keycloak.onAuthLogout = () => {
          localStorage.removeItem('inktide_kc_token')
          localStorage.removeItem('inktide_kc_refresh')
          clearAuthCookie()
        }
      })
      .catch(console.error)

    configureApiAuth({
      getToken: () => keycloak.token,
      isAuthenticated: () => keycloak.authenticated ?? false,
      refreshToken: () => keycloak.updateToken(60).then(() => true).catch(() => false),
    })
  }, [])

  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    initI18n().then(() => setI18nReady(true))
  }, [])

  if (!i18nReady) return null

  return (
    <AuthProvider
      keycloak={keycloak}
      tokenParser={tokenParser}
      localeSync={localeSync}
      avatarService={avatarService}
    >
      <KeycloakBootstrap>
        {children}
      </KeycloakBootstrap>
    </AuthProvider>
  )
}
