'use client'

import { useState } from 'react'
import { ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from '@/shared/ui'
import type { SoulCardData, SoulStatus } from './soul-card'
import { SoulAvatar } from './soul-avatar'


const STATUS_DOT: Record<SoulStatus, string> = {
  active:  'bg-[#22C55E]',
  online:  'bg-[#22C55E]',
  idle:    'bg-[#FACC15]',
  offline: 'bg-[#6B7280]',
}


interface SoulListRowProps {
  data: SoulCardData
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
  onDelete?: () => void
}

export function SoulListRow({ data, onOpen, onDelete }: SoulListRowProps) {
  const { t } = useTranslation('common')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const STATUS_LABEL: Record<SoulStatus, string> = {
    active:  t('soulCard.active'),
    online:  t('soulCard.online'),
    idle:    t('soulCard.idle'),
    offline: t('soulCard.offline'),
  }
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
        <SoulAvatar avatarUrl={avatarUrl} name={name} id={data.id} imgClassName="h-full w-full object-cover" />
        <span
          className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full ring-1 ring-[var(--bg-1)] ${STATUS_DOT[status]}`}
        />
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-semibold leading-tight text-[var(--text-primary)]">{name}</p>
        <p className="truncate text-xs leading-tight text-[var(--text-secondary)]">{subtitle}</p>
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

      {/* More options */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={e => e.stopPropagation()}
            className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            <MoreHorizontal size={14} />
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

      {/* Confirm delete - Dialog renders via Portal, position here doesn't matter */}
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
    </div>
  )
}
