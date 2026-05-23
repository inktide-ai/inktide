'use client'

import { Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { SoulCardData, SoulStatus } from './soul-card'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_DOT: Record<SoulStatus, string> = {
  online:  '#22c55e',
  active:  '#22c55e',
  idle:    '#9ca3af',
  offline: '#9ca3af',
}

const STATUS_LABEL: Record<SoulStatus, string> = {
  online:  'Online',
  active:  'Active',
  idle:    'Idle',
  offline: 'Offline',
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcDots = () => (
  <svg width={14} height={14} viewBox="0 0 30 24" fill="none" aria-hidden>
    <circle cx="3.5" cy="12" r="3.5" fill="currentColor" />
    <circle cx="15" cy="12" r="3.5" fill="currentColor" />
    <circle cx="26.5" cy="12" r="3.5" fill="currentColor" />
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

interface SoulCardVerticalProps {
  data: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
}

export function SoulCardVertical({ data, isFavorite, onFavoriteToggle, onOpen }: SoulCardVerticalProps) {
  return (
    <Card
      className="w-full cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      {/* Image area */}
      <div className="relative h-[180px] overflow-hidden rounded-t-2xl">
        <img
          src={data.avatarUrl}
          alt={data.name}
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {/* gradient for overlay readability */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status badge */}
        <div className="absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_DOT[data.status] }}
          />
          <span className="home-ui-font text-[12px] font-medium text-white">
            {STATUS_LABEL[data.status]}
          </span>
        </div>

        {/* Favorite star */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onFavoriteToggle() }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star
            size={13}
            className={isFavorite ? 'text-yellow-400' : 'text-white/70'}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex items-start justify-between px-3 py-2.5">
        <div className="min-w-0">
          <p className="home-heading-font truncate text-[14px] font-semibold text-[var(--text-primary)]">
            {data.name}
          </p>
          <p className="home-ui-font mt-0.5 truncate text-[12px] text-[var(--text-secondary)]">
            {data.subtitle}
          </p>
        </div>
        <button
          type="button"
          className="ml-2 flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          title="More options"
        >
          <IcDots />
        </button>
      </div>

    </Card>
  )
}
