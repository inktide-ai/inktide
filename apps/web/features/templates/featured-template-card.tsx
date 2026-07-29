'use client'

import { useTranslation } from 'react-i18next'
import type { AnyProjectTemplate } from '@/shared/data/project-templates'
import { TEMPLATE_ICONS } from './template-icons'

interface FeaturedTemplateCardProps {
  template: AnyProjectTemplate
  onPreview: () => void
}

const PLATFORM_LABELS: Record<string, string> = {
  twitch: 'Twitch',
  discord: 'Discord',
  telegram: 'Telegram',
  any: 'Any platform',
}

export function FeaturedTemplateCard({ template, onPreview }: FeaturedTemplateCardProps) {
  const { t } = useTranslation('common')

  const platforms = template.platforms.filter(p => p !== 'any')

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] transition-all duration-200 hover:border-[var(--card-accent)] hover:shadow-lg"
      style={{
        '--card-accent': `color-mix(in srgb, ${template.accentColor} 40%, transparent)`,
        background: `color-mix(in srgb, ${template.accentColor} 4%, var(--bg-1, #0f0f0f))`,
      } as React.CSSProperties}
    >
      {/* Preview area */}
      <div
        className="relative flex h-[156px] items-center justify-center"
        style={{
          background: `color-mix(in srgb, ${template.accentColor} 22%, var(--bg-1, #0f0f0f))`,
        }}
      >
        {TEMPLATE_ICONS[template.id] && (() => {
          const Icon = TEMPLATE_ICONS[template.id]
          return <Icon size={48} style={{ color: template.accentColor }} aria-hidden />
        })()}

        {/* Platform badges - top right */}
        {platforms.length > 0 && (
          <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1">
            {platforms.map(p => (
              <span
                key={p}
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  color: template.accentColor,
                  background: `color-mix(in srgb, ${template.accentColor} 18%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${template.accentColor} 30%, transparent)`,
                }}
              >
                {PLATFORM_LABELS[p] ?? p}
              </span>
            ))}
          </div>
        )}

        {/* Category badge - bottom left */}
        <span className="absolute bottom-3 left-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-1)]/70 px-2 py-0.5 text-[10px] font-medium capitalize text-[var(--text-tertiary)] backdrop-blur-sm">
          {template.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold leading-snug text-[var(--text-primary)]">
            {template.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)]">
            {template.description}
          </p>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-[var(--text-tertiary)]">{t(template.tagline)}</span>
          <button
            type="button"
            onClick={onPreview}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              color: template.accentColor,
              background: `color-mix(in srgb, ${template.accentColor} 15%, transparent)`,
            }}
          >
            {t('templates.useTemplate')}
          </button>
        </div>
      </div>
    </div>
  )
}
