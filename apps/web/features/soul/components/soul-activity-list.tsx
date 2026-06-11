'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getCardActivity } from '@/entities/soul/api/cards'
import { queryKeys } from '@/shared/lib/query/keys'
import { formatRelativeTime } from '@/features/soul/activity/lib/relative-time'

const ACTION_LABELS: Record<string, string> = {
  created:                  'Soul created',
  updated:                  'Settings updated',
  'status_changed:active':  'Soul started',
  'status_changed:paused':  'Soul paused',
  'status_changed:stopped': 'Soul stopped',
}

export function SoulActivityList({ soulId }: { soulId: string }) {
  const [open, setOpen] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.souls.activity(soulId),
    queryFn:  () => getCardActivity(soulId),
    refetchInterval: 30_000,
  })

  const events = data ?? []
  const latest = events[0]
  const headerRight = isLoading
    ? 'Loading…'
    : isError
      ? 'Unavailable'
      : events.length === 0
        ? 'No activity yet'
        : `${events.length} events · ${formatRelativeTime(new Date(latest.created_at))}`

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
        className="flex w-full cursor-pointer items-center px-5 py-4 text-left transition-colors hover:bg-[var(--surface-1)]"
      >
        <ChevronRight
          size={14}
          className={`mr-3 shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-body font-medium text-[var(--text-heading)]">Recent Activity</span>
        <span className="ml-auto text-body text-[var(--text-secondary)]">{headerRight}</span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-[var(--border-divider)] px-5 pb-4 pt-3">
              <div className="space-y-1.5">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[52px] animate-pulse rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)]"
                    />
                  ))
                ) : isError || events.length === 0 ? (
                  <p className="py-2 text-body text-[var(--text-tertiary)]">No activity yet</p>
                ) : (
                  events.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2"
                    >
                      <div>
                        <p className="text-body text-[var(--text-primary)]">
                          {ACTION_LABELS[item.action] ?? item.action}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {formatRelativeTime(new Date(item.created_at))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
