'use client'

import { MessageSquare, Tv2, Send, Radio, ExternalLink, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui/card'
import { Badge, type BadgeVariant } from '@/shared/ui/badge'

export type ProjectStatus = 'active' | 'paused' | 'archived'
export type ProjectPlatform = 'discord' | 'twitch' | 'telegram' | 'obs'

const STATUS_TO_BADGE: Record<ProjectStatus, BadgeVariant> = {
  active:   'active',
  paused:   'paused',
  archived: 'archived',
}

interface ActiveSoul {
  id: string
  name: string
  avatar_url?: string | null
}

interface ProjectGridCardProps {
  characterId: string
  title: string
  description?: string
  status: ProjectStatus
  updatedLabel: string
  coverUrl?: string | null
  previewUrl?: string | null
  platforms: string[]
  activeSoul?: ActiveSoul
  onOpen?: () => void
  onExport?: () => void
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'discord')  return <MessageSquare size={12} className="text-blue-400" />
  if (platform === 'twitch')   return <Tv2           size={12} className="text-violet-400" />
  if (platform === 'telegram') return <Send          size={12} className="text-sky-300" />
  return <Radio size={12} className="text-gray-400" />
}

export function ProjectGridCard({
  characterId: _characterId,
  title,
  description,
  status,
  updatedLabel,
  coverUrl,
  previewUrl,
  platforms,
  activeSoul,
  onOpen,
  onExport,
}: ProjectGridCardProps) {
  const { t } = useTranslation('common')
  const STATUS_LABELS: Record<ProjectStatus, string> = {
    active:   t('projectDetail.statusActive'),
    paused:   t('projectDetail.statusPaused'),
    archived: t('projectDetail.statusArchived'),
  }
  const safeStatus: ProjectStatus = ['active', 'paused', 'archived'].includes(status) ? status : 'active'
  const bgImage = coverUrl ?? activeSoul?.avatar_url ?? null

  const exportBtn = onExport && (
    <button
      type="button"
      title="Export project"
      onClick={e => { e.stopPropagation(); onExport() }}
      className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/35 text-white/90 hover:bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity dark:text-[#AAB2C7]"
    >
      <Download size={12} />
    </button>
  )

  return (
    <Card
      className="overflow-hidden cursor-pointer group"
      onClick={onOpen}
    >
      {/* Cover */}
      {previewUrl ? (
        <div className="relative h-[140px] w-full overflow-hidden bg-[var(--bg-2)]">
          <iframe
            src={previewUrl}
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
            title="Scene preview"
          />
          {exportBtn}
        </div>
      ) : (
        <div
          className="relative h-[140px] w-full bg-cover bg-center"
          style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined, backgroundColor: 'var(--bg-2)' }}
        >
          {bgImage && <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />}
          {exportBtn}
        </div>
      )}

      {/* Body */}
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[24px] font-semibold leading-none tracking-[-0.02em] text-[var(--text-primary)]">{title}</h3>
          <Badge className="shrink-0" variant={STATUS_TO_BADGE[safeStatus]}>{STATUS_LABELS[safeStatus]}</Badge>
        </div>

        <p className="min-h-[30px] text-xs leading-[1.25] text-[var(--text-secondary)]">
          {description || t('projectDetail.noDescription')}
        </p>

        {activeSoul && (
          <div className="flex items-center gap-1.5">
            {activeSoul.avatar_url ? (
              <img src={activeSoul.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
            ) : (
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--surface-2)] text-[8px] font-medium text-[var(--text-secondary)]">
                {activeSoul.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-[var(--text-secondary)]">{activeSoul.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-body">
            {platforms.slice(0, 3).map(p => <PlatformIcon key={p} platform={p} />)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">{updatedLabel}</span>
            {onOpen && (
              <ExternalLink
                size={11}
                className="text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
