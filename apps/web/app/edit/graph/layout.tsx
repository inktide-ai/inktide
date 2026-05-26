'use client'

import { type ReactNode } from 'react'
import ProtectedRoute from '@/components/layout/protected-route'
import { CharactersProvider } from '@/entities/character/context/CharactersContext'
import { WorkspaceSidebar } from '@/features/workspace-home/workspace-sidebar'

export default function GraphLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <div className="app-font-split flex h-screen overflow-hidden bg-[var(--bg-0)]">
          <WorkspaceSidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
