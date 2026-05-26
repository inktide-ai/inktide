'use client'
import { useState, useEffect } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Connector } from '@/components/icons'
import { ChIconDiscord, DISCORD_PLATFORM, WizardDiscordConfig } from './wizard-discord-config'

export interface WizardChannelsPanelProps {
  initialBotToken?: string
  onConfirm: (config?: { botToken?: string }) => void
}

export function WizardChannelsPanel({ initialBotToken, onConfirm }: WizardChannelsPanelProps) {
  const [discordActive, setDiscordActive] = useState(false)
  const [botToken, setBotToken] = useState(initialBotToken ?? '')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const isSplit = discordActive && !isMobile

  const handleConfirm = () => onConfirm(botToken ? { botToken } : undefined)

  const discordCard = (
    <button
      type="button"
      onClick={() => setDiscordActive(true)}
      className="w-full rounded-lg border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-0)]"
    >
      <div className={cn(
        'flex items-center gap-2.5 rounded-lg p-2.5',
        'transition-[background-color,box-shadow] duration-150 ease-out',
        discordActive
          ? 'bg-[var(--surface-card-hover)] shadow-[inset_0_0_0_1.5px_var(--accent-base)]'
          : 'bg-[var(--surface-2)]/60 shadow-[inset_0_0_0_1px_var(--border-subtle)] hover:bg-[var(--surface-2)] hover:shadow-[inset_0_0_0_1px_var(--border-default)]',
      )}>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
          style={{ background: DISCORD_PLATFORM.bg, color: DISCORD_PLATFORM.fg }}
        >
          <ChIconDiscord />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-medium leading-4 text-[var(--text-primary)]">Discord</span>
          <span className="block truncate text-[12px] leading-4 text-[var(--text-tertiary)]">{DISCORD_PLATFORM.subtitle}</span>
        </div>
      </div>
    </button>
  )

  const leftPanel = (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'flex flex-col overflow-hidden',
        isSplit ? 'w-[320px] shrink-0 border-r border-[var(--border-subtle)]' : 'flex-1',
      )}
    >
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)', color: 'var(--accent-base)' }}
          >
            <Connector size={20} />
          </div>
          <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Каналы и коннекторы
          </h2>
          <p className="home-ui-font mt-1 text-[14px] text-[var(--text-secondary)]">
            Подключите Discord бота к вашей душе.
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
        {discordCard}
        <p className="home-ui-font mt-4 text-center text-[11.5px] leading-relaxed text-[var(--text-tertiary)]">
          Полная настройка доступна после создания души.
        </p>
      </div>
    </motion.div>
  )

  if (isMobile && discordActive) {
    return (
      <div className="relative w-full max-w-[480px]">
        <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 backdrop-blur-md shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]" style={{ maxHeight: 'min(600px, calc(100vh - 80px))' }}>
          <div className="px-6 pt-6 pb-4 flex-shrink-0 text-center">
            <div className="mb-3 flex h-11 w-11 mx-auto items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)', color: 'var(--accent-base)' }}>
              <Connector size={20} />
            </div>
            <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Каналы и коннекторы</h2>
          </div>
        </div>
        <AnimatePresence>
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
            style={{ maxHeight: '85vh' }}
          >
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[var(--border-default)]" />
            <div className="flex items-center justify-between px-5 py-3">
              <span className="home-ui-font text-[14px] font-semibold text-[var(--text-primary)]">Configure Discord</span>
              <button type="button" onClick={() => setDiscordActive(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] transition-colors">
                <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <WizardDiscordConfig botToken={botToken} onChange={setBotToken} onConfirm={handleConfirm} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <LayoutGroup id="wizard-channels">
      <motion.div
        layout
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'flex w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)]',
          'bg-[var(--surface-1)]/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md',
          isSplit ? 'flex-row' : 'flex-col',
        )}
        style={{
          maxWidth: isSplit ? 820 : 480,
          maxHeight: 'min(600px, calc(100vh - 80px))',
        }}
      >
        {leftPanel}

        <AnimatePresence>
          {discordActive && (
            <motion.div
              key="discord-config"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-1 flex-col"
            >
              <WizardDiscordConfig botToken={botToken} onChange={setBotToken} onConfirm={handleConfirm} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  )
}
