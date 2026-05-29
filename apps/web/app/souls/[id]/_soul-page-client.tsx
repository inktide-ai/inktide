'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PROJECTS_ROUTE } from '@/lib/routes'
import { useCharactersContext } from '@/entities/character'
import {
  SoulActivityList, SoulCharacterCard, SoulMemorySnapshot, SoulMoodCard,
  SoulOverviewSkeleton, SoulPluginsCard, SoulQuickActions, SoulStatusCard, SoulVoiceCard,
} from '@/features/soul'
import { ErrorBoundary } from '@/shared/ui/error-boundary'
import { listProjects, type ProjectListItem } from '@/features/projects'

export function SoulPageClient() {
  const { selected, loading } = useCharactersContext()
  const { t } = useTranslation('common')
  const [projects, setProjects] = useState<ProjectListItem[]>([])

  useEffect(() => {
    if (!selected?.id) return
    listProjects()
      .then(all => setProjects(all.filter(p => p.active_soul_id === selected.id)))
      .catch(() => {})
  }, [selected?.id])

  if (loading || !selected) {
    return <SoulOverviewSkeleton />
  }

  return (
    <ErrorBoundary>
      <div className="px-5 py-4 space-y-3">
        {/* Main details card */}
        <SoulCharacterCard character={selected} />

        {/* Accordion sections */}
        <div className="overflow-hidden rounded-lg border border-[var(--border-card)] divide-y divide-[var(--border-divider)]">
          <SoulStatusCard character={selected} />
          <SoulActivityList />
          <SoulMemorySnapshot />
          <SoulPluginsCard />
        </div>

        {/* Linked projects */}
        <div className="overflow-hidden rounded-lg border border-[var(--border-card)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-divider)]">
            <div className="flex items-center gap-2 text-body font-semibold text-[var(--text-primary)]">
              <FolderOpen size={14} className="text-[var(--text-tertiary)]" />
              {t('soulPage.projects')}
            </div>
            <Link
              href={PROJECTS_ROUTE}
              className="flex items-center gap-1 text-body text-[var(--accent-hover)] hover:text-[var(--accent-primary)]"
            >
              <Plus size={12} />
              {t('soulPage.newProject')}
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="px-4 py-5 text-body text-[var(--text-tertiary)]">
              {t('soulPage.notInProject')}{' '}
              <Link href="/projects" className="text-[var(--accent-hover)] hover:underline">
                {t('soulPage.createProject')}
              </Link>{' '}
              {t('soulPage.andBind')}
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-divider)]">
              {projects.map(p => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-[var(--surface-1)] transition-colors"
                  >
                    <span className="text-body font-medium text-[var(--text-primary)]">{p.name}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                      p.status === 'active'
                        ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                        : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'
                    }`}>
                      {p.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottom tab panels */}
        <div className="flex overflow-hidden rounded-lg border border-[var(--border-card)] divide-x divide-[var(--border-divider)]">
          <div className="min-w-0 flex-1"><SoulVoiceCard character={selected} /></div>
          <div className="min-w-0 flex-1"><SoulMoodCard /></div>
          <div className="min-w-0 flex-1"><SoulQuickActions /></div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
