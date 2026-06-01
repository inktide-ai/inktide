'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import LoadingScreen from '@/shared/ui/loading-screen'
import { AuthProvider } from '@/shared/services/auth'
import { BillingProvider } from '@/entities/billing'
import { initI18n } from '@/i18n/i18n'
import { keycloak } from '@/lib/keycloak'
import { KeycloakBootstrap } from '@/lib/keycloak-bootstrap'
import { UserAccentHydration } from '@/shared/ui/user-accent-hydration'
import { LanguageSync } from '@/shared/ui/language-sync'
import { KeyboardProvider } from '@/shared/lib/keyboard'
import { queryClient } from '@/shared/lib/query/client'
import { tokenParser, localeSync, avatarService } from '@/shared/services/index'

export function Providers({ children }: { children: ReactNode }) {
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    const deadline = new Promise<void>(resolve => setTimeout(resolve, 6000))
    Promise.race([initI18n().catch(() => {}), deadline])
      .finally(() => setI18nReady(true))
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <KeyboardProvider>
      {i18nReady ? (
        <AuthProvider
          keycloak={keycloak}
          tokenParser={tokenParser}
          localeSync={localeSync}
          avatarService={avatarService}
        >
          <UserAccentHydration />
          <LanguageSync />
          <BillingProvider>
            <KeycloakBootstrap>
              {children}
            </KeycloakBootstrap>
          </BillingProvider>
        </AuthProvider>
      ) : <LoadingScreen />}
      </KeyboardProvider>
    </QueryClientProvider>
  )
}
