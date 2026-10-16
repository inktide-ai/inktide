import { type ReactNode } from 'react'
import { titleMetadata } from '@/lib/i18n-server'
import { ProtectedRoute } from '@/features/account'
import { CharactersProvider } from '@/entities/character'
import { ProjectLayoutClient } from './_project-layout-client'

export const generateMetadata = titleMetadata('project')

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <ProjectLayoutClient>{children}</ProjectLayoutClient>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
