'use client'

import { type ReactNode, useEffect } from 'react'
import { configureApiAuth } from '@/api/client'
import { keycloak } from '@/lib/keycloak'
import { clearSession, initKeycloakSession } from '@/lib/keycloak-session'

// Module-level guard survives Fast Refresh HMR re-mounts — useRef does not.
// Resets on full page reload (module re-evaluation), which is the correct behavior
// after keycloak.login() redirect.
let initialized = false

export function KeycloakBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (initialized) return
    initialized = true

    configureApiAuth({
      getToken:          () => keycloak.token,
      isAuthenticated:   () => keycloak.authenticated ?? false,
      refreshToken:      () => keycloak.updateToken(60).then(() => true).catch(() => false),
      onUnauthenticated: () => { clearSession(); keycloak.login() },
    })

    void initKeycloakSession()
  }, [])

  return <>{children}</>
}
