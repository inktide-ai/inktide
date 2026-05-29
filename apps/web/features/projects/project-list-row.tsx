'use client'

import { Download, ExternalLink, Gamepad2, MessageCircle, Radio, Tv2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, type BadgeVariant } from '@/shared/ui/badge'
import type { ProjectStatus } from './project-grid-card'

const STATUS_TO_BADGE: Record<ProjectStatus, BadgeVariant> = {
  active:   'active',
  paused:   'paused',
  archived: 'archived',
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'discord')  return <Gamepad2     size={12} className="text-blue-400" />
  if (platform === 'twitch')   return <MessageCircle size={12} className="text-violet-400" />
  if (platform === 'telegram') return <Tv2          size={12} className="text-sky-300" />
  return <Radio size={12} className="text-gray-400" />
}

interface ActiveSoul {
  id: string
  name: string
  avatar_url?: string | null
}

interface ProjectListRowProps {
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

export function ProjectListRow({
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
}: ProjectListRowProps) {
  const { t } = useTranslation('common')
  const STATUS_LABELS: Record<ProjectStatus, string> = {
    active:   t('projectDetail.statusActive'),
    paused:   t('projectDetail.statusPaused'),
    archived: t('projectDetail.statusArchived'),
  }
  const safeStatus: ProjectStatus = ['active', 'paused', 'archived'].includes(status) ? status : 'active'
  const thumbSrc = coverUrl ?? activeSoul?.avatar_url ?? null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => e.key === 'Enter' && onOpen?.()}
      className="group flex items-center gap-4 bg-[hsla(var(--bg-1),1)] px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--surface-1)] first:rounded-t-2xl last:rounded-b-2xl"
    >
      {/* Thumbnail */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-2)]">
        {previewUrl ? (
          <iframe
            src={previewUrl}
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
            title="Scene preview"
          />
        ) : thumbSrc ? (
          <img src={thumbSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[16px] font-semibold text-[var(--text-tertiary)]">
            {title.charAt(0).toUpperCase()}
          </div>
        )}
        {onExport && (
          <button
            type="button"
            title="Export project"
            onClick={e => { e.stopPropagation(); onExport() }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Download size={12} className="text-white" />
          </button>
        )}
      </div>

      {/* Title + description */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold leading-tight text-[var(--text-primary)]">{title}</p>
        <p className="truncate text-xs leading-tight text-[var(--text-secondary)]">
          {description || t('projectDetail.noDescription')}
        </p>
      </div>

      {/* Active soul */}
      {activeSoul && (
        <div className="flex shrink-0 items-center gap-1.5">
          {activeSoul.avatar_url ? (
            <img src={activeSoul.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-2)] text-[9px] font-medium text-[var(--text-secondary)]">
              {activeSoul.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs text-[var(--text-secondary)]">{activeSoul.name}</span>
        </div>
      )}

      {/* Status */}
      <Badge className="shrink-0" variant={STATUS_TO_BADGE[safeStatus]}>
        {STATUS_LABELS[safeStatus]}
      </Badge>

      {/* Platform icons */}
      {platforms.length > 0 && (
        <div className="flex shrink-0 items-center gap-1.5">
          {platforms.slice(0, 3).map(p => <PlatformIcon key={p} platform={p} />)}
        </div>
      )}

      {/* Updated */}
      <span className="w-[90px] shrink-0 text-right text-xs text-[var(--text-tertiary)]">
        {updatedLabel}
      </span>

      {/* Open arrow */}
      <ExternalLink
        size={13}
        className="shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  )
}
