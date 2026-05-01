'use client'

import { type ReactNode } from 'react'
import { CharactersProvider } from '@/context/CharactersContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import ProfileShell from '@/components/ProfileShell'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <ProfileShell>
          {children}
        </ProfileShell>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
