'use client'

import { motion } from 'framer-motion'
import type { SoulActivityEvent } from '../types'
import { formatRelativeTime } from '../lib/relative-time'

interface Props {
  event: SoulActivityEvent
  index: number
}

export function ActivityItem({ event, index }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-3 py-2.5"
    >
      <span
        aria-hidden
        className="mt-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center
                   rounded-xl bg-[var(--surface-2)] text-[1.1rem] leading-none"
      >
        {event.emoji}
      </span>

      <p className="flex-1 text-[0.8rem] leading-[1.55] text-[var(--text-secondary)]">
        {event.copy}
      </p>

      <time
        dateTime={event.occurred_at}
        className="mt-0.5 shrink-0 text-[0.7rem] text-[var(--text-tertiary)]"
      >
        {formatRelativeTime(new Date(event.occurred_at))}
      </time>
    </motion.div>
  )
}
