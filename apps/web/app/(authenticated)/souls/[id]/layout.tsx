import { type ReactNode } from 'react'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { SoulLayoutClient } from './_soul-layout-client'

// Next.js 15+: params is a Promise — must be awaited
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Soul ${id.slice(0, 8)}` }
}

export default function SoulLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <SoulLayoutClient>{children}</SoulLayoutClient>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
