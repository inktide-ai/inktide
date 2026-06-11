'use client'

import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/shared/services/auth'
import { BillingProvider } from '@/entities/billing'
import '@/i18n/i18n'
import { UserAccentHydration } from '@/shared/ui/user-accent-hydration'
import { LanguageSync } from '@/shared/ui/language-sync'
import { KeyboardProvider } from '@/shared/lib/keyboard'
import { queryClient } from '@/shared/lib/query/client'
import { avatarService } from '@/shared/services/index'
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="bottom-right" richColors />
      <KeyboardProvider>
        <AuthProvider avatarService={avatarService}>
          <UserAccentHydration />
          <LanguageSync />
          <BillingProvider>
            {children}
          </BillingProvider>
        </AuthProvider>
      </KeyboardProvider>
    </QueryClientProvider>
  )
}
