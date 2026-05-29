'use client'

import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Cpu, FlaskConical, Layers, LayoutDashboard, MemoryStick, Monitor, Puzzle, Radio, Settings, Download, Trash2, type LucideProps } from 'lucide-react'
import { ProjectRuntimeProvider, getProject, updateProject, deleteProject, exportProject } from '@/features/projects'
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar'
import { AppTopBar, type MoreActionItem } from '@/features/workspace-home'
import { queryKeys } from '@/shared/lib/query/keys'

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

export function ProjectLayoutClient({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const router = useRouter()
  const qc = useQueryClient()

  const { data: project } = useQuery({
    queryKey: queryKeys.projects.detail(id),
    queryFn: () => getProject(id),
  })

  const projectName   = project?.name   ?? 'Loading...'
  const projectStatus = project?.status ?? 'active'
  const isPlaying     = projectStatus === 'active'

  async function handleTogglePlay() {
    if (!project) return
    await updateProject(id, {
      name: project.name,
      active_model_id: project.active_model_id ?? null,
      active_scene_id: project.active_scene_id ?? null,
      status: isPlaying ? 'paused' : 'active',
    })
    await qc.invalidateQueries({ queryKey: queryKeys.projects.detail(id) })
  }

  async function handleExport() {
    const blob = await exportProject(id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project?.name ?? 'project'}.inkt`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${projectName}"? This cannot be undone.`)) return
    await deleteProject(id)
    router.push('/projects')
  }

  const moreItems: MoreActionItem[] = [
    {
      label: 'Settings',
      icon: <Settings size={13} />,
      onClick: () => router.push(`/projects/${id}/settings`),
    },
    {
      label: 'Export .inkt',
      icon: <Download size={13} />,
      onClick: () => void handleExport(),
    },
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Delete project',
      icon: <Trash2 size={13} />,
      onClick: () => void handleDelete(),
      danger: true,
    },
  ]

  return (
    <div className="app-font-split flex h-screen overflow-hidden bg-[var(--bg-0)]">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopBar
          title={projectName}
          parentLabel="Projects"
          parentHref="/projects"
          showStar
          online={isPlaying}
          showActions
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onExport={handleExport}
          moreItems={moreItems}
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
