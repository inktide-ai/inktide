'use client'

import { ExternalLink } from 'lucide-react'
import type { SoulCardData, SoulStatus } from './soul-card'

// ── Status dot ────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<SoulStatus, string> = {
  active:  'bg-[#22C55E]',
  online:  'bg-[#22C55E]',
  idle:    'bg-[#FACC15]',
  offline: 'bg-[#6B7280]',
}

const STATUS_LABEL: Record<SoulStatus, string> = {
  active:  'Active',
  online:  'Online',
  idle:    'Idle',
  offline: 'Offline',
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SoulListRowProps {
  data: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
}

export function SoulListRow({ data, onOpen }: SoulListRowProps) {
  const { name, subtitle, avatarUrl, accentColor, status } = data

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={e => e.key === 'Enter' && onOpen()}
      className="group flex items-center gap-4 bg-[hsla(var(--bg-1),1)] px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--surface-1)] first:rounded-t-2xl last:rounded-b-2xl"
    >
      {/* Avatar */}
      <div
        className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg"
        style={{ boxShadow: `0 0 0 2px ${accentColor}33` }}
      >
        <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        {/* Status dot */}
        <span
          className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full ring-1 ring-[var(--bg-1)] ${STATUS_DOT[status]}`}
        />
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold leading-tight text-[var(--text-primary)]">{name}</p>
        <p className="truncate text-[12px] leading-tight text-[var(--text-secondary)]">{subtitle}</p>
      </div>

      {/* Status label */}
      <span
        className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
        style={{
          background: status === 'idle' ? 'hsla(48,96%,53%,0.12)' : status === 'offline' ? 'hsla(0,0%,50%,0.12)' : 'hsla(142,71%,45%,0.12)',
          color: status === 'idle' ? '#FACC15' : status === 'offline' ? '#9CA3AF' : '#22C55E',
        }}
      >
        {STATUS_LABEL[status]}
      </span>

      {/* Open arrow */}
      <ExternalLink
        size={13}
        className="shrink-0 text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  )
}
