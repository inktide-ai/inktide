'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const ACTIVITY = [
  ['Twitch Chat', 'Responded to message', '2m ago'],
  ['Discord',     'Replied in #general',  '5m ago'],
  ['Memory',      'Stored new memory',    '15m ago'],
  ['OBS',         'Scene changed',        '1h ago'],
  ['Voice',       'Spoke for 2m 34s',     '2h ago'],
]

export function SoulActivityList() {
  const [open, setOpen] = useState(false)

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
        <span className="ml-auto mr-3 text-body text-[var(--text-secondary)]">5 events · last 2m ago</span>
        <button
          type="button"
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={e => e.stopPropagation()}
        >
          View all
        </button>
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
            {ACTIVITY.map(([title, subtitle, time]) => (
              <div
                key={title}
                className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2"
              >
                <div>
                  <p className="text-body text-[var(--text-primary)]">{title}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{time}</span>
              </div>
            ))}
          </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
