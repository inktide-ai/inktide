'use client'

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar'
import { AppTopBar } from '@/features/workspace-home'

export default function SoulsListLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <div className="app-font-split flex h-screen overflow-hidden bg-[var(--bg-0)]">
          <WorkspaceSidebar />
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <AppTopBar title={t('souls.title')} variant="page" />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
