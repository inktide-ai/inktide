'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AnyProjectTemplate } from '@/shared/data/project-templates'
import { TEMPLATE_ICONS } from './template-icons'

interface TemplatePreviewDrawerProps {
  template: AnyProjectTemplate
  onClose: () => void
  onUse: () => void
}

export function TemplatePreviewDrawer({ template, onClose, onUse }: TemplatePreviewDrawerProps) {
  const { t } = useTranslation('common')
  const [promptExpanded, setPromptExpanded] = useState(false)

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.aside
        className="fixed bottom-0 right-0 top-0 z-50 flex w-[400px] flex-col border-l border-[var(--border-subtle)] bg-[var(--card-bg)] shadow-2xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t('templates.previewTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {/* Template identity */}
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `color-mix(in srgb, ${template.accentColor} 16%, transparent)` }}
            >
              {TEMPLATE_ICONS[template.id] && (() => {
                const Icon = TEMPLATE_ICONS[template.id]
                return <Icon size={28} style={{ color: template.accentColor }} aria-hidden />
              })()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">{template.name}</h3>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{template.longDescription}</p>
            </div>
          </div>

          {/* Features */}
          {template.features.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                {t('templates.previewFeaturesLabel')}
              </p>
              <ul className="space-y-1.5">
                {template.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: template.accentColor }}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Platforms */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              {t('templates.previewPlatformsLabel')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {template.platforms.map(p => (
                <span
                  key={p}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--text-secondary)]"
                >
                  {p === 'any' ? 'All platforms' : p}
                </span>
              ))}
            </div>
          </div>

          {/* System prompt — collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setPromptExpanded(v => !v)}
              className="flex w-full items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]"
            >
              <span>{t('templates.previewPromptLabel')}</span>
              {promptExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {promptExpanded ? (
              <pre className="mt-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] p-4 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                {template.systemPrompt || '(empty)'}
              </pre>
            ) : (
              template.systemPrompt && (
                <p className="mt-2 line-clamp-3 text-xs text-[var(--text-tertiary)]">
                  {template.systemPrompt}
                </p>
              )
            )}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-[var(--border-subtle)] px-6 py-4">
          <button
            type="button"
            onClick={onUse}
            className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: template.accentColor }}
          >
            {t('templates.previewUseButton')}
          </button>
        </div>
      </motion.aside>
    </>
  )
}
