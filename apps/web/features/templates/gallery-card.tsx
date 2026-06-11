'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AnyProjectTemplate } from '@/shared/data/project-templates'

interface GalleryCardProps {
  template: AnyProjectTemplate
  onPreview: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function GalleryCard({ template, onPreview, onEdit, onDelete }: GalleryCardProps) {
  const { t } = useTranslation('common')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isUser = !template.isSystem

  return (
    <div
      className="group relative flex flex-col rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg"
      style={{
        '--template-accent': template.accentColor,
        borderColor: `color-mix(in srgb, ${template.accentColor} 30%, transparent)`,
        background: `color-mix(in srgb, ${template.accentColor} 8%, transparent)`,
      } as React.CSSProperties}
    >
      {/* User template actions */}
      {isUser && !confirmDelete && (
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onEdit?.() }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-tertiary)] transition-colors hover:border-red-900/40 hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl bg-[rgba(6,4,12,0.92)] p-4 backdrop-blur-sm">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{t('templates.deleteTitle')}</p>
          <p className="text-center text-xs text-[var(--text-tertiary)]">{t('templates.deleteBody')}</p>
          <div className="mt-1 flex w-full gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-lg border border-[var(--border-subtle)] py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
            >
              {t('templates.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onDelete?.()}
              className="flex-1 rounded-lg border border-red-900/40 bg-red-950/30 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/50"
            >
              {t('templates.deleteConfirm')}
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 select-none text-3xl">{template.emoji}</div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{template.name}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--text-tertiary)]">
          {template.description}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)]">{t(template.tagline)}</span>
        <button
          type="button"
          onClick={onPreview}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            color: template.accentColor,
            background: `color-mix(in srgb, ${template.accentColor} 15%, transparent)`,
          }}
        >
          {t('templates.useTemplate')}
        </button>
      </div>
    </div>
  )
}
