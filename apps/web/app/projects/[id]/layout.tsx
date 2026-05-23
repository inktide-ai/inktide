'use client'

import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Cpu, FlaskConical, Layers, LayoutDashboard, MemoryStick, Monitor, Puzzle, Radio, Settings, type LucideProps } from 'lucide-react'
import ProtectedRoute from '@/components/layout/protected-route'
import { CharactersProvider } from '@/context/CharactersContext'
import { ProjectRuntimeProvider } from '@/context/ProjectRuntimeContext'
import { WorkspaceSidebar } from '@/components/workspace/workspace-sidebar'
import { AppTopBar } from '@/components/workspace/app-topbar'
import { getProject } from '@/api/projects'
import { queryKeys } from '@/lib/query/keys'

const NAV_ITEMS: { label: string; href: string; icon: React.ComponentType<LucideProps>; buildHref?: (id: string) => string }[] = [
  { label: 'Overview',  href: '',          icon: LayoutDashboard },
  { label: 'Character', href: '/character', icon: Cpu             },
  { label: 'Scene',     href: '/scene',    icon: Layers          },
  { label: 'Channels',  href: '/channels', icon: Radio           },
  { label: 'Plugins',   href: '/plugins',  icon: Puzzle          },
  { label: 'Memory',    href: '/memory',   icon: MemoryStick     },
  { label: 'Sandbox',   href: '/sandbox',  icon: FlaskConical,   buildHref: (id) => `/edit/sandbox?projectId=${id}` },
  { label: 'OBS',       href: '/obs',      icon: Monitor         },
  { label: 'Settings',  href: '/settings', icon: Settings        },
]

function ProjectLayoutContent({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()

  const { data: project } = useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => getProject(id),
  })

  const projectName   = project?.name   ?? 'Loading...'
  const projectStatus = project?.status ?? 'active'

  return (
    <div className="app-font-split flex h-screen overflow-hidden bg-[var(--bg-0)]">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopBar
          title={projectName}
          parentLabel="Projects"
          parentHref="/projects"
          showStar
          online={projectStatus === 'active'}
          showActions
        />
        <nav className="flex shrink-0 items-center gap-px border-b border-[var(--border-subtle)] bg-[var(--bg-0)] px-4 py-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon, buildHref }) => {
            const to = buildHref ? buildHref(id) : `/projects/${id}${href}`
            const active = buildHref
              ? pathname.startsWith(`/edit/sandbox`)
              : href === '' ? pathname === `/projects/${id}` : pathname.startsWith(`/projects/${id}${href}`)
            return (
              <Link
                key={label}
                href={to}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={13} />
                {label}
              </Link>
            )
          })}
        </nav>
        <main className="flex-1 overflow-auto">
          <ProjectRuntimeProvider projectId={id}>
            {children}
          </ProjectRuntimeProvider>
        </main>
      </div>
    </div>
  )
}

export default function ProjectDetailLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <ProjectLayoutContent>{children}</ProjectLayoutContent>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
