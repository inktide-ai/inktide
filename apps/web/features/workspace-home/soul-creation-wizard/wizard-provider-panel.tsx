'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { type WizardProviderItem, WizardProviderCard } from './wizard-provider-card'
import { WizardProviderConfig } from './wizard-provider-config'

export interface WizardProviderPanelProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  panelType: 'llm' | 'tts'
  items: WizardProviderItem[]
  selectedId: string | null
  initialConfig?: Record<string, string>
  onSelect: (id: string, name: string, config?: Record<string, string>) => void
}

export function WizardProviderPanel({
  title, subtitle, icon, panelType, items, selectedId, initialConfig, onSelect,
}: WizardProviderPanelProps) {
  const { t } = useTranslation('common')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(selectedId)
  const [pendingConfig, setPendingConfig] = useState<Record<string, string>>(
    () => (selectedId ? (initialConfig ?? {}) : {}),
  )
  const [isMobile, setIsMobile] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!pendingId) {
      const t = setTimeout(() => searchRef.current?.focus(), 240)
      return () => clearTimeout(t)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.subtitle?.toLowerCase().includes(q),
    )
  }, [search, items])

  const handleCardClick = (item: WizardProviderItem) => {
    if (pendingId === item.id) return
    setPendingId(item.id)
    setPendingConfig({})
  }

  const handleConfirm = () => {
    if (!pendingId) return
    const item = items.find(i => i.id === pendingId)
    if (!item) return
    onSelect(item.id, item.name, Object.keys(pendingConfig).length > 0 ? pendingConfig : undefined)
  }

  const isSplit = !!pendingId && !isMobile

  const panelContent = (
    <LayoutGroup id={`wizard-provider-${panelType}`}>
      <motion.div
        layout
        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        className={cn(
          'flex w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)]',
          'bg-[var(--surface-1)]/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md',
          isSplit ? 'flex-row' : 'flex-col',
        )}
        style={{
          maxWidth: isSplit ? 900 : 560,
          maxHeight: 'min(600px, calc(100vh - 80px))',
        }}
      >
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={cn(
            'flex flex-col overflow-hidden',
            isSplit ? 'w-[320px] shrink-0 border-r border-[var(--border-subtle)]' : 'flex-1',
          )}
        >
          <div className="flex-shrink-0 px-6 pt-6 pb-4">
            <div className="mb-4 flex flex-col items-center text-center">
              <div
                className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)',
                  color: 'var(--accent-base)',
                }}
              >
                {icon}
              </div>
              <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                {title}
              </h2>
              <p className="home-ui-font mt-1 text-body text-[var(--text-secondary)]">
                {subtitle}
              </p>
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-[var(--text-tertiary)]">
                  <path d="M10 2C14.4183 2 18 5.58172 18 10C18 11.939 17.3088 13.7158 16.1611 15.1006L21.7803 20.7197C22.073 21.0126 22.0731 21.4874 21.7803 21.7803C21.4874 22.0731 21.0126 22.073 20.7197 21.7803L15.1006 16.1611C13.7158 17.3088 11.939 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 3.5C6.41015 3.5 3.5 6.41015 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.41015 13.5899 3.5 10 3.5Z" fill="currentColor" />
                </svg>
              </span>
              <input
                ref={searchRef}
                type="search"
                placeholder={t('wizard.searchProviders')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={cn(
                  'h-9 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 pl-9 pr-3',
                  'home-ui-font text-body text-[var(--text-primary)] outline-none',
                  'placeholder:text-[var(--text-tertiary)] transition-colors',
                  'focus:border-[var(--accent-base)]/50 focus:bg-[var(--surface-2)]',
                )}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
            {filtered.length > 0 ? (
              <div className={cn('grid gap-2', isSplit ? 'grid-cols-1' : 'grid-cols-2')}>
                {filtered.map(item => (
                  <WizardProviderCard
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    active={pendingId === item.id}
                    onSelect={() => handleCardClick(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[var(--text-tertiary)]">
                  <path d="M10 2C14.4183 2 18 5.58172 18 10C18 11.939 17.3088 13.7158 16.1611 15.1006L21.7803 20.7197C22.073 21.0126 22.0731 21.4874 21.7803 21.7803C21.4874 22.0731 21.0126 22.073 20.7197 21.7803L15.1006 16.1611C13.7158 17.3088 11.939 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 3.5C6.41015 3.5 3.5 6.41015 3.5 10C3.5 13.5899 6.41015 16.5 10 16.5C13.5899 16.5 16.5 13.5899 16.5 10C16.5 6.41015 13.5899 3.5 10 3.5Z" fill="currentColor" />
                </svg>
                <p className="home-ui-font text-body text-[var(--text-tertiary)]">
                  {t('wizard.noProvidersMatch')}
                </p>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="home-ui-font text-body text-[var(--accent-base)] hover:opacity-80 transition-opacity"
                >
                  {t('wizard.clearSearch')}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {!isMobile && (
          <AnimatePresence>
            {pendingId && (
              <motion.div
                key={pendingId}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, transition: { duration: 0.12 } }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-1 flex-col"
              >
                {(() => {
                  const item = items.find(i => i.id === pendingId)
                  if (!item) return null
                  return (
                    <WizardProviderConfig
                      panelType={panelType}
                      item={item}
                      config={pendingConfig}
                      onChange={(k, v) => setPendingConfig(prev => ({ ...prev, [k]: v }))}
                      onConfirm={handleConfirm}
                    />
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>
    </LayoutGroup>
  )

  if (isMobile && pendingId) {
    const activeItem = items.find(i => i.id === pendingId)
    return (
      <div className="relative w-full max-w-[560px]">
        <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 backdrop-blur-md shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]" style={{ maxHeight: 'min(600px, calc(100vh - 80px))' }}>
          <div className="px-6 pt-6 pb-4 flex-shrink-0">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)', color: 'var(--accent-base)' }}>
                {icon}
              </div>
              <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{title}</h2>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {activeItem && (
            <motion.div
              key={pendingId}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl border-t border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
              style={{ maxHeight: '85vh' }}
            >
              <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-[var(--border-default)]" />
              <div className="flex items-center justify-between px-5 py-3">
                <span className="home-ui-font text-body font-semibold text-[var(--text-primary)]">{t('wizard.configureProvider', { name: activeItem.name })}</span>
                <button type="button" onClick={() => setPendingId(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] transition-colors">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <WizardProviderConfig
                  panelType={panelType}
                  item={activeItem}
                  config={pendingConfig}
                  onChange={(k, v) => setPendingConfig(prev => ({ ...prev, [k]: v }))}
                  onConfirm={handleConfirm}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return panelContent
}
