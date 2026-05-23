'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

const PLUGINS: Array<[string, string, boolean]> = [
  ['Twitch Chat Listener', 'v1.2.1', true],
  ['Discord Bot',          'v2.0.3', true],
  ['Memory Manager',       'v1.1.0', true],
  ['Weather API',          'v1.0.0', false],
]

export function SoulPluginsCard() {
  const [open, setOpen] = useState(false)
  const active = PLUGINS.filter(p => p[2]).length

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
        <span className="text-[14px] font-medium text-[var(--text-heading)]">Active Plugins</span>
        <span className="ml-auto mr-3 text-[14px] text-[var(--text-secondary)]">{PLUGINS.length} plugins · {active} active</span>
        <button
          type="button"
          className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          onClick={e => e.stopPropagation()}
        >
          Manage
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--border-divider)] px-5 pb-4 pt-3">
          <div className="space-y-1.5">
            {PLUGINS.map(([name, version, enabled]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2"
              >
                <div>
                  <p className="text-[14px] text-[var(--text-primary)]">{name}</p>
                  <p className="text-[12px] text-[var(--text-tertiary)]">{version}</p>
                </div>
                <button
                  type="button"
                  className={`h-5 w-9 rounded-full p-0.5 transition-colors ${enabled ? 'bg-[var(--accent-hover)]' : 'bg-[var(--surface-3)]'}`}
                >
                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 h-8 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            Browse Plugins
          </button>
        </div>
      )}
    </div>
  )
}
