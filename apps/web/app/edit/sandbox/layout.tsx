import { Suspense, type ReactNode } from 'react'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { SandboxLayoutClient } from './_sandbox-layout-client'

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <Suspense fallback={null}>
          <SandboxLayoutClient>{children}</SandboxLayoutClient>
        </Suspense>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
