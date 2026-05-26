'use client'
import { useTranslation } from 'react-i18next'
import { SliderField } from '@/shared/ui/slider-field'
import { infoContent, formGroup, labelCls, labelHint, inputCls } from './panel-styles'
import type { PanelProps } from './types'

export function OpenAiCompatPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation('voice')
  const tts = character.tts
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={infoContent}>
      <div className={formGroup}>
        <label className={labelCls}>{t('baseUrl.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
        <div className={labelHint}>{t('baseUrl.hintCompatible')}</div>
        <input className={inputCls} type="text" placeholder="http://localhost:1234/v1" value={tts.baseUrl ?? ''} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('apiKey.label')}</label>
        <div className={labelHint}>{t('apiKey.hintCompatible')}</div>
        <input className={inputCls} type="password" placeholder="sk-…" autoComplete="new-password" value={tts.apiKey ?? ''} onChange={(e) => patch({ apiKey: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('voice.label')}</label>
        <div className={labelHint}>{t('voice.hintCompatible')}</div>
        <input className={inputCls} type="text" placeholder="alloy" value={tts.voiceId ?? ''} onChange={(e) => patch({ voiceId: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('model.label')}</label>
        <div className={labelHint}>{t('model.hintCompatible')}</div>
        <input className={inputCls} type="text" placeholder="tts-1" value={tts.modelId ?? ''} onChange={(e) => patch({ modelId: e.target.value || null })} />
      </div>
      <SliderField label={t('speed.label')} hint={t('speed.hintOpenAi')} value={Math.min(4.0, Math.max(0.25, tts.speed))} min={0.25} max={4.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ speed: v })} />
    </div>
  )
}
