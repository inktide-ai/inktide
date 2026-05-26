'use client'

import { Download, ExternalLink, Gamepad2, MessageCircle, Radio, Tv2 } from 'lucide-react'
import { Badge, type BadgeVariant } from '@/shared/ui/badge'
import type { ProjectStatus } from './project-grid-card'

const STATUS_TO_BADGE: Record<ProjectStatus, BadgeVariant> = {
  active:   'active',
  paused:   'paused',
  archived: 'archived',
}

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active:   'Active',
  paused:   'Paused',
  archived: 'Archived',
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'discord')  return <Gamepad2     size={12} className="text-[#60A5FA]" />
  if (platform === 'twitch')   return <MessageCircle size={12} className="text-[#A78BFA]" />
  if (platform === 'telegram') return <Tv2          size={12} className="text-[#38BDF8]" />
  return <Radio size={12} className="text-[#9CA3AF]" />
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
        <p className="truncate text-[14px] font-semibold leading-tight text-[var(--text-primary)]">{title}</p>
        <p className="truncate text-[12px] leading-tight text-[var(--text-secondary)]">
          {description || 'No description'}
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
          <span className="text-[12px] text-[var(--text-secondary)]">{activeSoul.name}</span>
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
      <span className="w-[90px] shrink-0 text-right text-[12px] text-[var(--text-tertiary)]">
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
