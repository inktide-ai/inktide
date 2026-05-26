'use client'
import { useTranslation } from 'react-i18next'
import { SliderField } from '@/shared/ui/slider-field'
import { ApiKeyCallout } from '@/shared/ui/api-key-callout'
import { OPENAI_VOICES, OPENAI_MODELS } from '@/shared/data/voice-models'
import { infoContent, formGroup, labelCls, labelHint, inputCls, voiceSelectWrap, voiceSelect } from './panel-styles'
import type { PanelProps } from './types'

const SelectChevron = () => (
  <svg className="absolute right-4 text-white/30 pointer-events-none shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export function OpenAiTtsPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation('voice')
  const tts = character.tts
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={infoContent}>
      <ApiKeyCallout show={!tts.apiKey?.trim()} />
      <div className={formGroup}>
        <label className={labelCls}>{t('apiKey.label')}</label>
        <div className={labelHint}>{t('apiKey.hintOpenAi')}</div>
        <input className={inputCls} type="password" placeholder="sk-…" autoComplete="new-password" value={tts.apiKey ?? ''} onChange={(e) => patch({ apiKey: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('voice.label')}</label>
        <div className={labelHint}>{t('voice.hintOpenAi')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.voiceId ?? 'alloy'} onChange={(e) => patch({ voiceId: e.target.value })}>
            {OPENAI_VOICES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('model.label')}</label>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.modelId ?? 'tts-1'} onChange={(e) => patch({ modelId: e.target.value })}>
            {OPENAI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <SliderField label={t('speed.label')} hint={t('speed.hintOpenAi')} value={Math.min(4.0, Math.max(0.25, tts.speed))} min={0.25} max={4.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ speed: v })} />
    </div>
  )
}
