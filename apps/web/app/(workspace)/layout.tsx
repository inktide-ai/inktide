import { type ReactNode } from 'react'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar'

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <div className="flex h-screen overflow-hidden bg-[var(--bg-0)]">
          <WorkspaceSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
