'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import LoadingScreen from '@/components/ui/loading-screen'
import { AuthProvider } from '@/context/AuthContext'
import { BillingProvider } from '@/context/BillingContext'
import { initI18n } from '@/i18n/i18n'
import { keycloak } from '@/lib/keycloak'
import { KeycloakBootstrap } from '@/lib/keycloak-bootstrap'
import { UserAccentHydration } from '@/components/user-accent-hydration'
import { queryClient } from '@/lib/query/client'
import { tokenParser, localeSync, avatarService } from '@/services/index'

export function Providers({ children }: { children: ReactNode }) {
  const [i18nReady, setI18nReady] = useState(false)

  useEffect(() => {
    const deadline = new Promise<void>(resolve => setTimeout(resolve, 6000))
    Promise.race([initI18n().catch(() => {}), deadline])
      .finally(() => setI18nReady(true))
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <UserAccentHydration />
      {i18nReady ? (
        <AuthProvider
          keycloak={keycloak}
          tokenParser={tokenParser}
          localeSync={localeSync}
          avatarService={avatarService}
        >
          <BillingProvider>
            <KeycloakBootstrap>
              {children}
            </KeycloakBootstrap>
          </BillingProvider>
        </AuthProvider>
      ) : <LoadingScreen />}
    </QueryClientProvider>
  )
}
