'use client'

import { useState } from 'react'
import { Star, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/shared/ui/card'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/shared/ui'
import type { SoulCardData, SoulStatus } from './soul-card'
import { SoulAvatar } from './soul-avatar'


const STATUS_DOT: Record<SoulStatus, string> = {
  online:  '#22c55e',
  active:  '#22c55e',
  idle:    '#9ca3af',
  offline: '#9ca3af',
}


const IcDots = () => (
  <svg width={14} height={14} viewBox="0 0 30 24" fill="none" aria-hidden>
    <circle cx="3.5" cy="12" r="3.5" fill="currentColor" />
    <circle cx="15" cy="12" r="3.5" fill="currentColor" />
    <circle cx="26.5" cy="12" r="3.5" fill="currentColor" />
  </svg>
)


interface SoulCardVerticalProps {
  data: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
  onDelete?: () => void
}

export function SoulCardVertical({ data, isFavorite, onFavoriteToggle, onOpen, onDelete }: SoulCardVerticalProps) {
  const { t } = useTranslation('common')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const STATUS_LABEL: Record<SoulStatus, string> = {
    online:  t('soulCard.online'),
    active:  t('soulCard.active'),
    idle:    t('soulCard.idle'),
    offline: t('soulCard.offline'),
  }

  return (
    <Card
      className="w-full cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
      onClick={onOpen}
    >
      {/* Image area */}
      <div className="relative h-[180px] overflow-hidden rounded-t-2xl">
        <SoulAvatar
          avatarUrl={data.avatarUrl}
          name={data.name}
          id={data.id}
          imgClassName="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Status badge */}
        <div className="absolute bottom-2.5 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_DOT[data.status] }}
          />
          <span className="home-ui-font text-xs font-medium text-white">
            {STATUS_LABEL[data.status]}
          </span>
        </div>

        {/* Favorite star */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onFavoriteToggle() }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-colors hover:bg-black/60"
          title={isFavorite ? t('soulCard.removeFavorite') : t('soulCard.addFavorite')}
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
          <p className="home-heading-font truncate text-body font-semibold text-[var(--text-primary)]">
            {data.name}
          </p>
          <p className="home-ui-font mt-0.5 truncate text-xs text-[var(--text-secondary)]">
            {data.subtitle}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={e => e.stopPropagation()}
              className="ml-2 flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              title={t('soulCard.moreOptions')}
            >
              <IcDots />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={e => e.stopPropagation()}
            className="min-w-[140px] rounded-xl border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)] p-1 shadow-[var(--menu-panel-shadow)]"
          >
            <DropdownMenuItem
              onSelect={() => setConfirmOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 outline-none hover:bg-[var(--surface-2)] focus:bg-[var(--surface-2)]"
            >
              <Trash2 size={13} />
              {t('soulCard.delete', 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirm delete - DialogContent renders via Portal outside this Card */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          onClick={e => e.stopPropagation()}
          className="fixed left-1/2 top-1/2 z-[2001] w-[min(400px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)] p-6 shadow-[var(--menu-panel-shadow)] outline-none"
        >
          <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
            {t('soulCard.deleteConfirmTitle', 'Delete soul?')}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[var(--text-secondary)]">
            {t('soulCard.deleteConfirmBody', '«{{name}}» will be permanently deleted. This action cannot be undone.', { name: data.name })}
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              {t('actions.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={() => { setConfirmOpen(false); onDelete?.() }}
              className="h-9 rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600"
            >
              {t('actions.delete', 'Delete')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
