'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SliderField } from '@/shared/ui/slider-field'
import { LANG_LABELS, VOICE_GROUPS } from '@/shared/data/kokoro-voices'
import { infoContent, formGroup, labelCls, labelHint, inputCls, voiceSelectWrap, voiceSelect, advancedToggle, advancedPanel } from './panel-styles'
import type { PanelProps } from './types'

const ChevronSVG = ({ open }: { open: boolean }) => (
  <svg className={cn('transition-transform duration-200 ease', open && 'rotate-180')} width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SelectChevron = () => (
  <svg className="absolute right-4 text-white/30 pointer-events-none shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export function KokoroPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation('voice')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const tts = character.tts

  return (
    <div className={infoContent}>
      <div className={formGroup}>
        <label className={labelCls}>{t('voice.label')}</label>
        <div className={labelHint}>{t('voice.hintKokoro')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.voiceId ?? ''} onChange={(e) => onUpdate({ tts: { ...tts, voiceId: e.target.value || null } })}>
            <option value="">{t('voice.selectPlaceholder')}</option>
            {Array.from(VOICE_GROUPS.entries()).map(([lang, voices]) => (
              <optgroup key={lang} label={LANG_LABELS[lang] ?? lang}>
                {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </optgroup>
            ))}
          </select>
          <SelectChevron />
        </div>
      </div>
      <SliderField label={t('speed.label')} value={tts.speed} min={0.5} max={2.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => onUpdate({ tts: { ...tts, speed: v } })} />
      <button type="button" className={advancedToggle} onClick={() => setAdvancedOpen((o) => !o)}>
        <ChevronSVG open={advancedOpen} />
        {t('advanced')}
      </button>
      {advancedOpen && (
        <div className={advancedPanel}>
          <div className={`${formGroup} mb-0`}>
            <label className={labelCls}>{t('baseUrl.label')}</label>
            <div className={labelHint}>{t('baseUrl.hintKokoro')}</div>
            <input className={inputCls} type="text" placeholder="http://127.0.0.1:8880/v1" value={tts.baseUrl ?? ''} onChange={(e) => onUpdate({ tts: { ...tts, baseUrl: e.target.value || null } })} />
          </div>
        </div>
      )}
    </div>
  )
}
