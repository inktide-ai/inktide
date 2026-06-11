'use client'

import { type ReactNode } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { AppTopBar } from '@/features/workspace-home'
import { ProjectRuntimeProvider, useProjectRuntimeContext } from '@/features/projects'
import { ProjectNavLinks } from '@/features/projects/ui/ProjectNavLinks'

function SoulProjectLayoutInner({ children }: { children: ReactNode }) {
  const { id: soulId, projectId } = useParams<{ id: string; projectId: string }>()
  const pathname = usePathname()
  const base = `/souls/${soulId}/projects/${projectId}`

  const { project } = useProjectRuntimeContext()
  const projectName   = project?.name   ?? 'Loading...'
  const projectStatus = project?.status ?? 'active'

  const showActions = pathname.startsWith(`${base}/sandbox`)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar
        title={projectName}
        parentLabel="Projects"
        parentHref={`/souls/${soulId}/projects`}
        titleHref={base}

        showActions={showActions}
      />
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-0)] h-12 px-2 md:px-6 py-2 overflow-y-clip overflow-x-auto">
        <nav className="flex items-center gap-px">
          <ProjectNavLinks base={base} projectId={projectId} pathname={pathname} />
        </nav>
        <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)]">
          <span className={`h-1.5 w-1.5 rounded-full ${projectStatus === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {projectName}
        </span>
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export function SoulProjectLayoutClient({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  return (
    <ProjectRuntimeProvider projectId={projectId}>
      <SoulProjectLayoutInner>{children}</SoulProjectLayoutInner>
    </ProjectRuntimeProvider>
  )
}
