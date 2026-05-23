'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/layout/protected-route'
import { CharactersProvider } from '@/context/CharactersContext'
import { WorkspaceSidebar } from '@/components/workspace/workspace-sidebar'
import { AppTopBar } from '@/components/workspace/app-topbar'
import { getProject } from '@/api/projects'

function SandboxLayoutContent({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const [projectName, setProjectName] = useState('Loading...')

  useEffect(() => {
    if (!projectId) { setProjectName('Sandbox'); return }
    getProject(projectId)
      .then(p => setProjectName(p.name))
      .catch(() => setProjectName('Project'))
  }, [projectId])

  return (
    <div className="app-font-split sandbox-text-render flex h-screen overflow-hidden bg-[var(--bg-0)]">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopBar
          title={projectName}
          parentLabel="Projects"
          parentHref="/projects"
          titleHref={projectId ? `/projects/${projectId}` : '/projects'}
          subTitle={projectId ? 'Sandbox' : undefined}
          showActions
        />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function SandboxLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <SandboxLayoutContent>{children}</SandboxLayoutContent>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
