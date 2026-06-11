'use client'

import { useTranslation } from 'react-i18next'

export function SoulGraphPreview() {
  const { t } = useTranslation('common')
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-body font-medium text-[var(--text-heading)]">{t('widgets.graphOverview')}</p>
        <button type="button" className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          {t('widgets.open')}
        </button>
      </div>
      <div className="grid h-[108px] grid-cols-4 gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--graph-node-bg)] p-2">
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Twitch</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">{t('widgets.nodeMessage')}</div>
        <div className="rounded border border-[var(--graph-node-active-border)] bg-[var(--graph-node-active-bg)] p-1 text-[9px] text-[var(--accent-violet-text)]">{t('widgets.nodeIntent')}</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">OBS</div>
        <div className="col-span-2 rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">{t('widgets.nodeMemorySearch')}</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">{t('widgets.nodeGenerate')}</div>
        <div className="rounded border border-[var(--border-default)] bg-[var(--surface-1)] p-1 text-[9px] text-[var(--text-secondary)]">Discord</div>
      </div>
    </div>
  )
}
