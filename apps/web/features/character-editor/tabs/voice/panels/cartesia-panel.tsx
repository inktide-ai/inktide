'use client'
import { useTranslation } from 'react-i18next'
import { SliderField } from '@/components/ui/slider-field'
import { ApiKeyCallout } from '@/components/ui/api-key-callout'
import { useVoiceProvider } from '@/hooks/useVoiceProvider'
import { CARTESIA_MODELS } from '@/data/voice-models'
import { infoContent, formGroup, labelCls, labelHint, inputCls, voiceSelectWrap, voiceSelect } from './panel-styles'
import type { PanelProps } from './types'

const SelectChevron = () => (
  <svg className="absolute right-4 text-white/30 pointer-events-none shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

export function CartesiaPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation('voice')
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('cartesia', apiKey)
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={infoContent}>
      <ApiKeyCallout show={!apiKey.trim()} />
      <div className={formGroup}>
        <label className={labelCls}>{t('apiKey.label')}</label>
        <div className={labelHint}>{t('apiKey.hintCartesia')}</div>
        <input className={inputCls} type="password" placeholder="sk_car_…" autoComplete="new-password" value={apiKey} onChange={(e) => patch({ apiKey: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('voice.label')}</label>
        <div className={labelHint}>{!apiKey.trim() ? t('voice.hintEnterKey') : voicesLoading ? t('voice.loading') : t('voice.hintCartesia')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.voiceId ?? ''} disabled={!apiKey.trim() || voicesLoading} onChange={(e) => patch({ voiceId: e.target.value || null })}>
            <option value="">{t('voice.selectPlaceholder')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('model.label')}</label>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.modelId ?? 'sonic-2'} onChange={(e) => patch({ modelId: e.target.value })}>
            {CARTESIA_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <SliderField label={t('speed.label')} hint={t('speed.hintCartesia')} value={Math.min(2.0, Math.max(0.0, tts.speed))} min={0.0} max={2.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ speed: v })} />
    </div>
  )
}
