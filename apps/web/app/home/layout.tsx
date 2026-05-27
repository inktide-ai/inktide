'use client'

import { type ReactNode } from 'react'
import ProtectedRoute from '@/features/account/protected-route'
import { CharactersProvider } from '@/entities/character/context/CharactersContext'
import { WorkspaceSidebar } from '@/features/workspace-home/workspace-sidebar'
import { AppTopBar } from '@/features/workspace-home/app-topbar'

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--bg-0)]">
          <WorkspaceSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppTopBar title="Dashboard" variant="page" />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
