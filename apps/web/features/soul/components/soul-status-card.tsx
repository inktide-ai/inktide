'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'

function TwitchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" fill="currentColor" />
    </svg>
  )
}

const STAT_COLORS = ['#8B5CF6', '#3B82F6', '#22C55E', '#F59E0B']
const STAT_VALUES = ['23%', '512 MB', '1.2K', '7d 14h']

export function SoulStatusCard({ character }: { character: AiCharacter }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const hasDiscord = character.channels.some(c => c.platform === 'discord' && c.is_active)
  const hasTwitch  = character.channels.some(c => c.platform === 'twitch'  && c.is_active)

  const STATS = [
    { label: t('soulCard.status.cpu'),         value: STAT_VALUES[0], color: STAT_COLORS[0] },
    { label: t('soulCard.status.memory'),      value: STAT_VALUES[1], color: STAT_COLORS[1] },
    { label: t('soulCard.status.messages24h'), value: STAT_VALUES[2], color: STAT_COLORS[2] },
    { label: t('soulCard.status.uptime'),      value: STAT_VALUES[3], color: STAT_COLORS[3] },
  ]

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
        <span className="text-body font-medium text-[var(--text-heading)]">{t('soulCard.status.title')}</span>
        <span className="ml-auto mr-3 text-body text-[var(--text-secondary)]">{t('soulCard.status.cpu')} 23% · {t('soulCard.status.uptime')} 7d 14h</span>
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)]">
          <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden>
            <path d="M1 4l3 3 5-6" stroke="var(--success-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            style={{ overflow: 'hidden' }}
          >
        <div className="border-t border-[var(--border-divider)] px-5 pb-5 pt-4">
          <div className="grid grid-cols-4 gap-3">
            {STATS.map(item => (
              <div key={item.label} className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
                <p className="text-xs text-[var(--text-tertiary)]">{item.label}</p>
                <p className="mt-1 text-[22px] leading-none font-semibold text-[var(--text-heading)]">{item.value}</p>
                <div className="mt-2 h-1 rounded-full bg-[var(--surface-2)]">
                  <div className="h-full rounded-full" style={{ width: '65%', background: item.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 text-body">
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div className="flex items-center gap-1.5 text-[var(--accent-violet-text)]"><TwitchIcon /> Twitch</div>
              <p className="mt-0.5 text-xs">{hasTwitch ? t('soulCard.status.connected') : t('soulCard.status.notConnected')}</p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div>Discord</div>
              <p className="mt-0.5 text-xs">{hasDiscord ? t('soulCard.status.connected') : t('soulCard.status.notConnected')}</p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div>OBS</div>
              <p className="mt-0.5 text-xs">{t('soulCard.status.connected')}</p>
            </div>
            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] p-2.5 text-[var(--text-secondary)]">
              <div>Memory</div>
              <p className="mt-0.5 text-xs text-[var(--success-text)]">{t('soulCard.status.healthy')}</p>
            </div>
          </div>
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
