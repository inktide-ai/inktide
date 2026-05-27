'use client'

import { type ReactNode } from 'react'
import { CharactersProvider } from '@/entities/character/context/CharactersContext'
import ProtectedRoute from '@/features/account/protected-route'
import ProfileShell from '@/features/account/profile-shell'

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
