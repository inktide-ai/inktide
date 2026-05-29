'use client'

import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar'
import { AppTopBar } from '@/features/workspace-home'

export default function HomeLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common')
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--bg-0)]">
          <WorkspaceSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppTopBar title={t('home.title')} variant="page" />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
