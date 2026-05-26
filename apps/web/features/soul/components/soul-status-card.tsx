'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import type { AiCharacter } from '@/lib/character'

function TwitchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="currentColor" />
    </svg>
  )
}

const STATS = [
  { label: 'CPU',           value: '23%',    color: '#8B5CF6' },
  { label: 'Memory',        value: '512 MB', color: '#3B82F6' },
  { label: 'Messages (24h)',value: '1.2K',   color: '#22C55E' },
  { label: 'Uptime',        value: '7d 14h', color: '#F59E0B' },
]

export function SoulStatusCard({ character }: { character: AiCharacter }) {
  const [open, setOpen] = useState(false)
  const hasDiscord = character.channels.some(c => c.platform === 'discord' && c.is_active)
  const hasTwitch  = character.channels.some(c => c.platform === 'twitch'  && c.is_active)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center px-5 py-4 text-left transition-colors hover:bg-[var(--surface-1)]"
      >
        <ChevronRight
          size={14}
          className={`mr-3 shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
        />
        <span className="text-[14px] font-medium text-[var(--text-heading)]">Soul Status</span>
        <span className="ml-auto mr-3 text-[14px] text-[var(--text-secondary)]">CPU 23% · Uptime 7d 14h</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)]">
          <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden>
            <path d="M1 4l3 3 5-6" stroke="var(--success-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--border-divider)] px-5 pb-5 pt-4">
          <div className="grid grid-cols-4 gap-3">
            {STATS.map(item => (
              <div key={item.label} className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
                <p className="text-[12px] text-[var(--text-tertiary)]">{item.label}</p>
                <p className="mt-1 text-[22px] leading-none font-semibold text-[var(--text-heading)]">{item.value}</p>
                <div className="mt-2 h-1 rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full" style={{ width: '65%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 text-[14px]">
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 text-[var(--accent-violet-text)]"><TwitchIcon /> Twitch</div>
              <p className="mt-0.5 text-[12px]">{hasTwitch ? 'Connected' : 'Not connected'}</p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div>Discord</div>
              <p className="mt-0.5 text-[12px]">{hasDiscord ? 'Connected' : 'Not connected'}</p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div>OBS</div>
              <p className="mt-0.5 text-[12px]">Connected</p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div>Memory</div>
              <p className="mt-0.5 text-[12px] text-[var(--success-text)]">Healthy</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
