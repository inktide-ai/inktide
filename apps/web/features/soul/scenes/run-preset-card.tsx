'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MoreHorizontal, Zap, ZapOff } from 'lucide-react'
import type { RunPreset } from '@/features/soul/api/index'

interface RunPresetCardProps {
  preset: RunPreset
  onActivate: (id: string) => Promise<void>
  onDeactivate: () => Promise<void>
  onEdit: (preset: RunPreset) => void
  onDelete: (preset: RunPreset) => void
}

function OverrideRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-body text-[var(--text-tertiary)]">{label}</span>
      <span className="text-body font-medium text-[var(--text-secondary)]">
        {value ?? <span className="text-[var(--text-tertiary)] italic">Soul default</span>}
      </span>
    </div>
  )
}

function temperatureLabel(t: number | null): string | null {
  if (t === null) return null
  if (t <= 0.3) return `${t} · Precise`
  if (t <= 0.7) return `${t} · Balanced`
  if (t <= 1.2) return `${t} · Creative`
  return `${t} · Wild`
}

export function RunPresetCard({ preset, onActivate, onDeactivate, onEdit, onDelete }: RunPresetCardProps) {
  const [busy, setBusy] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleActivate = async () => {
    setBusy(true)
    try { await onActivate(preset.id) }
    finally { setBusy(false) }
  }

  const handleDeactivate = async () => {
    setBusy(true)
    try { await onDeactivate() }
    finally { setBusy(false) }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className={[
        'relative flex flex-col gap-3 rounded-[14px] border p-4 transition-all duration-200',
        preset.is_active
          ? 'border-[var(--accent-base)] shadow-[0_0_0_1px_var(--accent-base),0_4px_24px_0_color-mix(in_srgb,var(--accent-base)_20%,transparent)] bg-[var(--surface-panel)]'
          : 'border-[var(--border-card)] bg-[var(--surface-panel)] hover:border-[var(--border-divider)]',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {preset.icon && (
            <span className="text-[18px] leading-none select-none" aria-hidden>
              {preset.icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="home-heading-font truncate text-body font-semibold text-[var(--text-heading)]">
              {preset.name}
            </p>
            {preset.description && (
              <p className="home-ui-font truncate text-body text-[var(--text-tertiary)]">{preset.description}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {preset.is_active && (
            <AnimatePresence mode="wait">
              <motion.span
                key="live"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-base)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                LIVE
              </motion.span>
            </AnimatePresence>
          )}

          {/* Context menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              className="grid h-7 w-7 place-items-center rounded-md text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="More options"
            >
              <MoreHorizontal size={14} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-8 z-20 w-36 rounded-[10px] border border-[var(--border-card)] bg-[var(--surface-panel)] py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onEdit(preset) }}
                      className="w-full px-3 py-1.5 text-left text-body text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onDelete(preset) }}
                      className="w-full px-3 py-1.5 text-left text-body text-red-400 hover:bg-[var(--surface-1)]"
                    >
                      Delete
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Overrides */}
      <div className="rounded-[8px] bg-[var(--surface-0)] px-3 py-2">
        <OverrideRow label="Model" value={preset.override_llm_model_id} />
        <OverrideRow label="Temperature" value={temperatureLabel(preset.override_temperature)} />
        <OverrideRow label="Emotion" value={preset.override_emotion_preset_id} />
        <OverrideRow label="Voice" value={preset.override_voice_profile_id} />
      </div>

      {/* Action */}
      <div className="flex items-center justify-end">
        {preset.is_active ? (
          <button
            type="button"
            disabled={busy}
            onClick={handleDeactivate}
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-divider)] px-3 py-1.5 text-body font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-card)] hover:text-[var(--text-primary)] disabled:opacity-50"
          >
            <ZapOff size={12} />
            Deactivate
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={handleActivate}
            className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-base)] px-3 py-1.5 text-body font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Zap size={12} />
            {busy ? 'Switching…' : 'Activate'}
          </button>
        )}
      </div>
    </motion.article>
  )
}
