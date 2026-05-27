'use client'

import { useEffect, type ReactNode } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import ProtectedRoute from '@/features/account/protected-route'
import { CharactersProvider, useCharactersContext } from '@/entities/character/context/CharactersContext'
import { WorkspaceSidebar } from '@/features/workspace-home/workspace-sidebar'
import { AppTopBar } from '@/features/workspace-home/app-topbar'

const NAV_ITEMS = [
  { label: 'Overview', href: ''          },
  { label: 'Avatars',  href: '/avatars'  },
  { label: 'Scenes',   href: '/scenes'   },
  { label: 'Brain',    href: '/brain'    },
  { label: 'Voice',    href: '/voice'    },
  { label: 'Emotion',  href: '/emotion'  },
]

function SoulLayoutContent({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>()
  const soulId = params.id
  const pathname = usePathname()
  const { selected, selectedId, selectCard, cardLoadError } = useCharactersContext()

  useEffect(() => {
    if (soulId && (!selected || selectedId !== soulId)) {
      void selectCard(soulId)
    }
  }, [soulId, selectedId, selected, selectCard])

  if (cardLoadError && !selected) {
    return (
      <div className="app-font-split flex h-screen items-center justify-center bg-[var(--bg-0)]">
        <p className="text-[14px] text-[var(--text-secondary)]">Failed to load soul — try refreshing the page.</p>
      </div>
    )
  }

  const isInProject = /^\/souls\/[^/]+\/projects\/[^/]/.test(pathname)

  return (
    <div className="app-font-split flex h-screen overflow-hidden bg-[var(--bg-0)]">
      <WorkspaceSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {!isInProject && (
          <AppTopBar
            title={selected?.name ?? 'Loading...'}
            parentLabel="Souls"
            parentHref="/souls"
            showStar
            online={selected?.isActive ?? false}
            showActions
          />
        )}
        {!pathname.startsWith(`/souls/${soulId}/projects`) && <nav className="flex shrink-0 items-center gap-px border-b border-[var(--border-subtle)] bg-[var(--bg-0)] px-4 py-2">
          {NAV_ITEMS.map(({ label, href }) => {
            const to = `/souls/${soulId}${href}`
            const active = href === '' ? pathname === to : pathname.startsWith(to)
            return (
              <Link
                key={label}
                href={to}
                className={`flex items-center rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--sidebar-active)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function SoulLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CharactersProvider>
        <SoulLayoutContent>{children}</SoulLayoutContent>
      </CharactersProvider>
    </ProtectedRoute>
  )
}
