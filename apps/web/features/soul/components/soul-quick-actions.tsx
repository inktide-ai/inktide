'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui'
import { updateCardStatus } from '@/entities/soul/api/cards'
import { queryKeys } from '@/shared/lib/query/keys'
import { SANDBOX_ROUTE } from '@/lib/routes'
import type { AiCharacter } from '@/shared/lib/character'

export function SoulQuickActions({ character }: { character: AiCharacter }) {
  const { t } = useTranslation('common')
  const router = useRouter()
  const queryClient = useQueryClient()

  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false)
  const [shutdownConfirmOpen, setShutdownConfirmOpen] = useState(false)

  const restartMutation = useMutation({
    mutationFn: async () => {
      await updateCardStatus(character.id, 'stop')
      await updateCardStatus(character.id, 'start')
    },
    onSuccess: () => {
      toast.success('Soul restarted')
      void queryClient.invalidateQueries({ queryKey: queryKeys.souls.detail(character.id) })
    },
    onError: () => toast.error('Failed to restart soul'),
  })

  const shutdownMutation = useMutation({
    mutationFn: () => updateCardStatus(character.id, 'stop'),
    onSuccess: () => {
      toast.success('Soul stopped')
      void queryClient.invalidateQueries({ queryKey: queryKeys.souls.detail(character.id) })
    },
    onError: () => toast.error('Failed to stop soul'),
  })

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-body font-medium text-[var(--text-heading)]">{t('soulCard.quickActions')}</p>
      </div>
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => router.push(SANDBOX_ROUTE)}
          className="flex h-7 w-full items-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          {t('soulCard.chatWithSoul')}
        </button>

        <button
          type="button"
          onClick={() => setRestartConfirmOpen(true)}
          disabled={restartMutation.isPending || shutdownMutation.isPending}
          className="flex h-7 w-full items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {restartMutation.isPending && <Loader2 size={10} className="animate-spin" />}
          {t('soulCard.restartSoul')}
        </button>

        <button
          type="button"
          onClick={() => setShutdownConfirmOpen(true)}
          disabled={shutdownMutation.isPending || restartMutation.isPending}
          className="flex h-7 w-full items-center gap-1.5 rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 text-xs text-[var(--danger-text)] hover:bg-[var(--danger-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {shutdownMutation.isPending && <Loader2 size={10} className="animate-spin" />}
          {t('soulCard.shutdownSoul')}
        </button>
      </div>

      {/* Restart confirm */}
      <Dialog open={restartConfirmOpen} onOpenChange={setRestartConfirmOpen}>
        <DialogContent className="fixed left-1/2 top-1/2 z-[2001] w-[min(400px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)] p-6 shadow-[var(--menu-panel-shadow)] outline-none">
          <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
            Restart soul?
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[var(--text-secondary)]">
            «{character.name}» will stop and immediately restart. Active conversations will be interrupted.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRestartConfirmOpen(false)}
              className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { setRestartConfirmOpen(false); restartMutation.mutate() }}
              className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-body font-medium text-white hover:bg-[var(--accent-hover)]"
            >
              Restart
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Shutdown confirm */}
      <Dialog open={shutdownConfirmOpen} onOpenChange={setShutdownConfirmOpen}>
        <DialogContent className="fixed left-1/2 top-1/2 z-[2001] w-[min(400px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)] p-6 shadow-[var(--menu-panel-shadow)] outline-none">
          <DialogTitle className="text-base font-semibold text-[var(--text-primary)]">
            Shut down soul?
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-[var(--text-secondary)]">
            «{character.name}» will stop responding until manually restarted.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShutdownConfirmOpen(false)}
              className="rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-body text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => { setShutdownConfirmOpen(false); shutdownMutation.mutate() }}
              className="rounded-lg bg-[var(--color-error-mid,#dc2626)] px-4 py-2 text-body font-medium text-white hover:opacity-90"
            >
              Shut down
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
