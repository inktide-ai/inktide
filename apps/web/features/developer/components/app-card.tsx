'use client'

import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Settings, Trash2 } from 'lucide-react'
import type { ApplicationDto } from '../api/developer'

interface AppCardProps {
  app: ApplicationDto
  onDelete?: (id: string) => void
}

export function AppCard({ app, onDelete }: AppCardProps) {
  const router = useRouter()
  const { t } = useTranslation('developer')

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-[var(--border-subtle)] p-5 hover:bg-[var(--surface-1)] transition-colors">
      <div className="flex items-start gap-4">
        {app.iconUrl ? (
          <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-sm font-bold text-[var(--text-tertiary)] shrink-0">
            {app.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <p className="text-body-md font-semibold text-[var(--text-heading)]">{app.name}</p>
          {app.description && (
            <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{app.description}</p>
          )}
          <p className="text-xs text-[var(--text-tertiary)] font-mono">{app.keycloakClientId}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push(`/developer/apps/${app.id}`)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
          title={t('apps.settings')}
        >
          <Settings size={15} />
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(app.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-red-500/10 hover:text-red-500 transition-colors"
            title={t('apps.delete')}
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
