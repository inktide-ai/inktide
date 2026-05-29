'use client'

import { useTranslation } from 'react-i18next'

export function SoulQuickActions() {
  const { t } = useTranslation('common')

  const ACTIONS = [
    t('soulCard.chatWithSoul'),
    t('soulCard.forceMemorySave'),
    t('soulCard.restartSoul'),
  ]

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-body font-medium text-[var(--text-heading)]">{t('soulCard.quickActions')}</p>
      </div>
      <div className="space-y-1.5">
        {ACTIONS.map(item => (
          <button
            key={item}
            type="button"
            className="flex h-7 w-full items-center rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="flex h-7 w-full items-center rounded-md border border-[var(--danger-border)] bg-[var(--danger-bg)] px-2.5 text-xs text-[var(--danger-text)] hover:bg-[var(--danger-bg-hover)]"
        >
          {t('soulCard.shutdownSoul')}
        </button>
      </div>
    </div>
  )
}
