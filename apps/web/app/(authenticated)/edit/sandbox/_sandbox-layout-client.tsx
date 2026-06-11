'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar'
import { AppTopBar } from '@/features/workspace-home'
import { getProject } from '@/features/projects'

export function SandboxLayoutClient({ children }: { children: ReactNode }) {
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
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopBar
          title={projectName}
          parentLabel="Projects"
          parentHref="/projects"
          titleHref={projectId ? `/projects/${projectId}` : '/projects'}
          subTitle={projectId ? 'Sandbox' : undefined}
        />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
