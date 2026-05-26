'use client'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'
import { addCustomSceneTag } from '@/features/soul/api/index' // fsd:cross-feature-ok — soul editor

const MAX_LEN = 128
const TAG_COLOR_PRESETS = ['#818cf8', '#a78bfa', '#f472b6', '#4ade80', '#38bdf8', '#fb923c', '#f87171', '#facc15']

const modalFieldLabel = 'text-[14px] font-medium tracking-[0.07em] uppercase text-white/35 mb-2 flex items-center gap-[6px]'
const modalTextInput = 'w-full bg-white/[0.05] border border-[0.5px] border-white/12 rounded-[10px] p-[11px_14px] text-[14px] text-(--text-primary) outline-none font-[inherit] transition-[border-color] duration-150 placeholder:text-white/25 focus:border-white/30'

interface NewTagModalProps {
  cardId: string
  onClose: () => void
  onCreated: (label: string) => void
}

export function NewTagModal({ cardId, onClose, onCreated }: NewTagModalProps) {
  const { t } = useTranslation('scene')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(TAG_COLOR_PRESETS[0]!)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = label.trim()
  const canSubmit = trimmed.length > 0 && !submitting

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCreate() {
    if (!trimmed) { setError(t('newTag.errorEmpty')); return }
    setSubmitting(true)
    setError(null)
    try {
      await addCustomSceneTag(cardId, trimmed, color)
      onCreated(trimmed)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('newTag.errorGeneric'))
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-6" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-[#1a1a1f] border border-[0.5px] border-white/12 rounded-2xl w-full max-w-[520px] overflow-hidden animate-[pageIn_0.18s_cubic-bezier(0.2,0.9,0.2,1)]">
        <div className="flex items-center justify-between p-[20px_24px_0]">
          <span className="text-[17px] font-medium text-(--text-primary)">{t('newTag.title')}</span>
          <button type="button" className="w-7 h-7 rounded-full bg-white/[0.07] border-none cursor-pointer flex items-center justify-center text-white/50 transition-[background,color] duration-[120ms] p-0 hover:bg-white/[0.13] hover:text-(--text-primary)" onClick={onClose} aria-label={t('newTag.closeAria')}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="p-[20px_24px] flex flex-col gap-[18px]">
          <div>
            <div className={modalFieldLabel}>{t('newTag.label')}</div>
            <input className={modalTextInput} placeholder={t('newTag.placeholder')} value={label} onChange={e => setLabel(e.target.value.slice(0, MAX_LEN))} maxLength={MAX_LEN} autoFocus />
            <div className="text-[14px] text-white/25 text-right mt-1">{label.length}/{MAX_LEN} · {t('newTag.maxLength', { max: MAX_LEN })}</div>
          </div>

          <div>
            <div className={modalFieldLabel}>Цвет тега</div>
            <div className="flex flex-col gap-[10px] mt-[6px]">
              {/* react-colorful — override via .new-tag-picker class in globals.css */}
              <div className="new-tag-picker-wrap">
                <HexColorPicker color={color} onChange={setColor} className="new-tag-picker" />
              </div>
              <div className="flex gap-[7px] flex-wrap">
                {TAG_COLOR_PRESETS.map(c => (
                  <button key={c} type="button" className={cn('w-6 h-6 rounded-[6px] border-2 cursor-pointer p-0 transition-[transform,border-color] duration-100 hover:scale-[1.15]', color === c ? 'border-white/80 scale-[1.1]' : 'border-transparent')} style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
                ))}
              </div>
              <div className="flex items-center gap-[10px]">
                <span className="text-[0.6875rem] font-semibold tracking-[0.04em] uppercase py-[3px] px-2 rounded-[4px] whitespace-nowrap" style={{ color, background: `${color}1a`, border: `1px solid ${color}59` }}>
                  {trimmed || 'Тег'}
                </span>
                <span className="text-[0.75rem] font-medium text-[rgba(191,191,203,0.45)] tabular-nums">{color.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {error && <div className="mt-3 text-[0.75rem] text-[#e05c5c]">{error}</div>}
        </div>

        <div className="flex gap-[10px] p-[0_24px_24px]">
          <button type="button" className="flex-1 p-[11px] rounded-[10px] bg-white/[0.06] border border-[0.5px] border-white/12 text-white/60 text-[14px] cursor-pointer font-[inherit] transition-[background] duration-[120ms] hover:enabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed" onClick={onClose} disabled={submitting}>{t('newTag.cancel')}</button>
          <button type="button" className="flex-[2] p-[11px] rounded-[10px] bg-[#7c3aed] border-none text-white text-[14px] font-medium cursor-pointer font-[inherit] transition-[background] duration-[120ms] hover:enabled:bg-[#6d28d9] disabled:bg-[rgba(124,58,237,0.3)] disabled:text-white/30 disabled:cursor-not-allowed" disabled={!canSubmit} onClick={handleCreate}>{submitting ? t('newTag.creating') : t('newTag.create')}</button>
        </div>
      </div>
    </div>
  )
}
