'use client'

import { useEffect, type ReactNode } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character'
import { WorkspaceSidebar } from '@/widgets/workspace-sidebar'
import { AppTopBar } from '@/features/workspace-home'

export function SoulLayoutClient({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>()
  const soulId = params.id
  const pathname = usePathname()
  const { selected, selectedId, selectCard, cardLoadError } = useCharactersContext()
  const { t } = useTranslation('common')

  const NAV_ITEMS = [
    { label: t('soulLayout.overview'), href: ''          },
    { label: t('soulLayout.avatars'),  href: '/avatars'  },
    { label: t('soulLayout.scenes'),   href: '/scenes'   },
    { label: t('soulLayout.brain'),    href: '/brain'    },
    { label: t('soulLayout.voice'),    href: '/voice'    },
    { label: t('soulLayout.emotion'),  href: '/emotion'  },
  ]

  useEffect(() => {
    if (soulId && (!selected || selectedId !== soulId)) {
      void selectCard(soulId)
    }
  }, [soulId, selectedId, selected, selectCard])

  if (cardLoadError && !selected) {
    return (
      <div className="app-font-split flex h-screen items-center justify-center bg-[var(--bg-0)]">
        <p className="text-body text-[var(--text-secondary)]">{t('soulLayout.failedToLoad')}</p>
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
            title={selected?.name ?? t('soulLayout.loading')}
            parentLabel={t('soulLayout.backToSouls')}
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
                key={href}
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
