'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SliderField } from '@/shared/ui/slider-field'
import { ApiKeyCallout } from '@/shared/ui/api-key-callout'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { ELEVENLABS_MODELS } from '@/shared/data/voice-models'
import { infoContent, formGroup, labelCls, labelHint, inputCls, voiceSelectWrap, voiceSelect, advancedToggle, advancedPanel, toggleRow } from './panel-styles'
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

export function ElevenLabsPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation('voice')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('elevenlabs', apiKey)
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={infoContent}>
      <ApiKeyCallout show={!apiKey.trim()} />
      <div className={formGroup}>
        <label className={labelCls}>{t('apiKey.label')}</label>
        <div className={labelHint}>{t('apiKey.hintProvider', { provider: 'ElevenLabs' })}</div>
        <input className={inputCls} type="password" placeholder="sk_…" autoComplete="new-password" value={apiKey} onChange={(e) => patch({ apiKey: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('voice.label')}</label>
        <div className={labelHint}>{!apiKey.trim() ? t('voice.hintEnterKey') : voicesLoading ? t('voice.loading') : t('voice.hintChoose')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.voiceId ?? ''} disabled={!apiKey.trim() || voicesLoading} onChange={(e) => patch({ voiceId: e.target.value || null })}>
            <option value="">{t('voice.selectPlaceholder')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('model.label')}</label>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.modelId ?? 'eleven_multilingual_v2'} onChange={(e) => patch({ modelId: e.target.value })}>
            {ELEVENLABS_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <SliderField label={t('stability.label')} hint={t('stability.hint')} value={tts.stability} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} onChange={(v) => patch({ stability: v })} />
      <SliderField label={t('similarityBoost.label')} hint={t('similarityBoost.hint')} value={tts.similarityBoost} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} onChange={(v) => patch({ similarityBoost: v })} />
      <SliderField label={t('style.label')} hint={t('style.hint')} value={tts.style} min={0} max={1} step={0.01} format={(v) => v.toFixed(2)} onChange={(v) => patch({ style: v })} />
      <SliderField label={t('speed.label')} value={Math.min(1.2, Math.max(0.7, tts.speed))} min={0.7} max={1.2} step={0.01} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ speed: v })} />
      <SliderField label={t('pitch.label')} hint={t('pitch.hintElevenLabs')} value={tts.pitch} min={0.5} max={2.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ pitch: v })} />
      <SliderField label={t('volume.label')} hint={t('volume.hintElevenLabs')} value={tts.volume} min={0.1} max={2.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ volume: v })} />
      <div className={toggleRow}>
        <div>
          <div className="text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary)">{t('speakerBoost.label')}</div>
          <div className={labelHint}>{t('speakerBoost.hint')}</div>
        </div>
        <label className="toggle-control">
          <input type="checkbox" checked={tts.useSpeakerBoost} onChange={(e) => patch({ useSpeakerBoost: e.target.checked })} />
          <div className="toggle-track" />
        </label>
      </div>
      <button type="button" className={advancedToggle} onClick={() => setAdvancedOpen((o) => !o)}>
        <ChevronSVG open={advancedOpen} />
        {t('advanced')}
      </button>
      {advancedOpen && (
        <div className={advancedPanel}>
          <div className={`${formGroup} mb-0`}>
            <label className={labelCls}>{t('baseUrl.label')}</label>
            <div className={labelHint}>{t('baseUrl.hintElevenLabs')}</div>
            <input className={inputCls} type="text" placeholder="https://api.elevenlabs.io" value={tts.baseUrl ?? ''} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
          </div>
        </div>
      )}
    </div>
  )
}
