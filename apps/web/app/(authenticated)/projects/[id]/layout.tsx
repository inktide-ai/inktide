import { type ReactNode } from 'react'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { ProjectLayoutClient } from './_project-layout-client'

// Next.js 15+: params is a Promise - must be awaited
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return { title: `Project ${id.slice(0, 8)}` }
}

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <ProjectLayoutClient>{children}</ProjectLayoutClient>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
