'use client'

import { type ReactNode, useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/shared/services/auth'
import { KeyboardProvider } from '@/shared/lib/keyboard'
import { queryClient } from '@/shared/lib/query/client'
import i18n, { initI18n } from '@/i18n/i18n'
import { avatarService } from '@/shared/services/index'

export function PublicProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    // common + landing are bundled - init is already synchronous.
    // This effect ensures other namespaces (profile, voice, ...) get fetched
    // lazily by HttpBackend for any client-side navigations that need them.
    if (!i18n.isInitialized) initI18n().catch(() => {})
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" richColors />
      <KeyboardProvider>
        <AuthProvider avatarService={avatarService}>
          {children}
        </AuthProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  )
}
