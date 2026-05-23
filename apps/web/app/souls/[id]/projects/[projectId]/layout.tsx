'use client'

import React, { type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import {
  Cpu, FlaskConical, Layers, LayoutDashboard,
  MemoryStick, Monitor, Radio, Settings, Zap, type LucideProps,
} from 'lucide-react'
import { AppTopBar } from '@/components/workspace/app-topbar'
import { ProjectRuntimeProvider, useProjectRuntimeContext } from '@/context/ProjectRuntimeContext'

const NAV_ITEMS: { label: string; href: string; icon: React.ComponentType<LucideProps>; buildHref?: (pid: string) => string }[] = [
  { label: 'Overview',  href: '',           icon: LayoutDashboard },
  { label: 'Character', href: '/character', icon: Cpu             },
  { label: 'Scene',     href: '/scene',     icon: Layers          },
  { label: 'Channels',  href: '/channels',  icon: Radio           },
  { label: 'Skills',    href: '/skills',    icon: Zap             },
  { label: 'Memory',    href: '/memory',    icon: MemoryStick     },
  { label: 'Sandbox',   href: '/sandbox',   icon: FlaskConical    },
  { label: 'OBS',       href: '/obs',       icon: Monitor         },
  { label: 'Settings',  href: '/settings',  icon: Settings        },
]

function SoulProjectLayoutInner({ children }: { children: ReactNode }) {
  const { id: soulId, projectId } = useParams<{ id: string; projectId: string }>()
  const pathname = usePathname()
  const base = `/souls/${soulId}/projects/${projectId}`

  const { project } = useProjectRuntimeContext()
  const projectName   = project?.name   ?? 'Loading...'
  const projectStatus = project?.status ?? 'active'

  const currentTab = NAV_ITEMS.find(
    item => item.href !== '' && pathname.startsWith(`${base}${item.href}`)
  )
  const subTitle   = currentTab?.label
  const showActions = pathname.startsWith(`${base}/sandbox`)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar
        title={projectName}
        parentLabel="Projects"
        parentHref={`/souls/${soulId}/projects`}
        titleHref={base}
        subTitle={subTitle}
        showActions={showActions}
      />
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-0)] h-12 px-2 md:px-6 py-2 overflow-y-clip overflow-x-auto">
        <nav className="flex items-center gap-px">
          {NAV_ITEMS.map(({ label, href, icon: Icon, buildHref }) => {
            const to = buildHref ? buildHref(projectId) : `${base}${href}`
            const active = buildHref
              ? pathname.startsWith('/edit/sandbox')
              : href === '' ? pathname === base : pathname.startsWith(`${base}${href}`)
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
        <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)]">
          <span className={`h-1.5 w-1.5 rounded-full ${projectStatus === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {projectName}
        </span>
      </div>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export default function SoulProjectLayout({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  return (
    <ProjectRuntimeProvider projectId={projectId}>
      <SoulProjectLayoutInner>{children}</SoulProjectLayoutInner>
    </ProjectRuntimeProvider>
  )
}
