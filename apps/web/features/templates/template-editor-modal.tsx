'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CreateTemplateData } from '@/shared/lib/templates/ITemplateStore'
import type { UserProjectTemplate } from '@/shared/data/project-templates'

const ACCENT_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#6b7280',
]

const CATEGORIES = ['streaming', 'assistant', 'vtuber', 'utility'] as const

interface TemplateEditorModalProps {
  mode: 'create' | 'edit'
  initialData?: UserProjectTemplate
  onClose: () => void
  onSave: (data: CreateTemplateData) => Promise<void>
}

export function TemplateEditorModal({ mode, initialData, onClose, onSave }: TemplateEditorModalProps) {
  const { t } = useTranslation('common')
  const [emoji, setEmoji] = useState(initialData?.emoji ?? '🤖')
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState<string>(initialData?.category ?? 'utility')
  const [accentColor, setAccentColor] = useState(initialData?.accentColor ?? '#7c3aed')
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSave = name.trim().length > 0 && systemPrompt.trim().length > 0

  async function handleSave() {
    if (!canSave || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        emoji,
        description: description.trim() || name.trim(),
        accentColor,
        defaultName: name.trim(),
        systemPrompt: systemPrompt.trim(),
        category,
        platforms: ['any'],
      })
    } catch {
      setError(t('templates.errorSave'))
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-[560px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)] shadow-2xl"
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {mode === 'create' ? t('templates.createTitle') : t('templates.editTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
          {/* Emoji + Name row */}
          <div className="flex gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {t('templates.fieldEmoji')}
              </label>
              <input
                type="text"
                value={emoji}
                onChange={e => {
                  const chars = [...e.target.value].filter(c => /\p{Emoji}/u.test(c))
                  if (chars.length > 0) setEmoji(chars[chars.length - 1]!)
                }}
                className="w-[56px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3 py-2.5 text-center text-2xl outline-none focus:border-[var(--accent-primary)]"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {t('templates.fieldName')} <span className="text-[var(--accent-primary)]">*</span>
              </label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Custom Template"
                maxLength={80}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              {t('templates.fieldDescription')}{' '}
              <span className="text-[var(--text-tertiary)]">{t('templates.fieldDescriptionOptional')}</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this template do?"
              maxLength={200}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Category + Color row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {t('templates.fieldCategory')}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)]"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {t('templates.fieldColor')}
              </label>
              <div className="flex gap-1.5 pt-0.5">
                {ACCENT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccentColor(color)}
                    className="h-8 w-8 rounded-lg border-2 transition-all"
                    style={{
                      background: color,
                      borderColor: accentColor === color ? 'white' : 'transparent',
                      transform: accentColor === color ? 'scale(1.15)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              {t('templates.fieldPrompt')} <span className="text-[var(--accent-primary)]">*</span>
            </label>
            <p className="mb-2 text-xs text-[var(--text-tertiary)]">{t('templates.fieldPromptHint')}</p>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="You are a helpful AI assistant that..."
              rows={8}
              maxLength={4000}
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 font-mono text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
            <p className="mt-1 text-right text-xs text-[var(--text-tertiary)]">
              {systemPrompt.length}/4000
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            {t('templates.cancel')}
          </button>
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('templates.saving')}
              </>
            ) : (
              mode === 'create' ? t('templates.createTitle') : t('templates.saveChanges')
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
