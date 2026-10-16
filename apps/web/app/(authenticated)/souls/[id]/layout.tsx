import { type ReactNode } from 'react'
import { titleMetadata } from '@/lib/i18n-server'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { SoulLayoutClient } from './_soul-layout-client'

export const generateMetadata = titleMetadata('character')

export default function SoulLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <SoulLayoutClient>{children}</SoulLayoutClient>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
