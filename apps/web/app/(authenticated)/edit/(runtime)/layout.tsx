import { type ReactNode } from 'react'
import { CharactersProvider } from '@/entities/character'
import { ProtectedRoute } from '@/features/account'
import { ProfileShell } from '@/widgets/profile-shell'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <div className="app-font-split">
          <ProfileShell>
            {children}
          </ProfileShell>
        </div>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
