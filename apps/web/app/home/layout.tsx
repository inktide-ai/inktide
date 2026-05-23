'use client'

import { type ReactNode } from 'react'
import ProtectedRoute from '@/components/layout/protected-route'
import { CharactersProvider } from '@/context/CharactersContext'
import { WorkspaceSidebar } from '@/components/workspace/workspace-sidebar'
import { AppTopBar } from '@/components/workspace/app-topbar'

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
