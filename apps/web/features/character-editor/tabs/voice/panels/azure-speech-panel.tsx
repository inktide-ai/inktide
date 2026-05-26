'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SliderField } from '@/shared/ui/slider-field'
import { ApiKeyCallout } from '@/shared/ui/api-key-callout'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { infoContent, formGroup, labelCls, labelHint, inputCls, voiceSelectWrap, voiceSelect, advancedToggle, advancedPanel } from './panel-styles'
import type { PanelProps } from './types'

const AZURE_REGIONS = [
  { code: 'eastus',        label: 'East US' }, { code: 'eastus2',       label: 'East US 2' },
  { code: 'westus',        label: 'West US' }, { code: 'westus2',       label: 'West US 2' },
  { code: 'westus3',       label: 'West US 3' }, { code: 'northeurope',   label: 'North Europe' },
  { code: 'westeurope',    label: 'West Europe' }, { code: 'uksouth',       label: 'UK South' },
  { code: 'eastasia',      label: 'East Asia' }, { code: 'southeastasia', label: 'Southeast Asia' },
  { code: 'japaneast',     label: 'Japan East' }, { code: 'australiaeast', label: 'Australia East' },
]

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

export function AzureSpeechPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation('voice')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''
  const region = tts.baseUrl ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('azure-speech', apiKey, region)
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })
  const canLoadVoices = apiKey.trim() && region.trim()

  return (
    <div className={infoContent}>
      <ApiKeyCallout show={!apiKey.trim()} />
      <div className={formGroup}>
        <label className={labelCls}>{t('apiKey.label')}</label>
        <div className={labelHint}>{t('apiKey.hintProvider', { provider: 'Microsoft Azure Speech' })}</div>
        <input className={inputCls} type="password" placeholder="Azure subscription key" autoComplete="new-password" value={apiKey} onChange={(e) => patch({ apiKey: e.target.value || null })} />
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('region.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
        <div className={labelHint}>{t('region.hint')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={AZURE_REGIONS.some((r) => r.code === region) ? region : '__custom__'} onChange={(e) => { if (e.target.value !== '__custom__') patch({ baseUrl: e.target.value }) }}>
            <option value="__custom__" disabled={AZURE_REGIONS.some((r) => r.code === region)}>{AZURE_REGIONS.some((r) => r.code === region) ? '' : t('region.customOption')}</option>
            {AZURE_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.label} ({r.code})</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <div className={formGroup}>
        <label className={labelCls}>{t('voice.label')}</label>
        <div className={labelHint}>{!canLoadVoices ? t('voice.hintEnterKeyAndRegion') : voicesLoading ? t('voice.loading') : t('voice.hintAzure')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={tts.voiceId ?? ''} disabled={!canLoadVoices || voicesLoading} onChange={(e) => patch({ voiceId: e.target.value || null })}>
            <option value="">{t('voice.selectPlaceholder')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </select>
          <SelectChevron />
        </div>
      </div>
      <SliderField label={t('pitch.label')} hint={t('pitch.hintAdjust')} value={tts.pitch} min={-50} max={50} step={1} format={(v) => v > 0 ? `+${v}%` : `${v}%`} onChange={(v) => patch({ pitch: v })} />
      <SliderField label={t('speed.label')} hint={t('speed.hintRate')} value={Math.min(2.0, Math.max(0.5, tts.speed))} min={0.5} max={2.0} step={0.05} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => patch({ speed: v })} />
      <SliderField label={t('volume.label')} hint={t('volume.hintAdjust')} value={tts.volume} min={-50} max={50} step={1} format={(v) => v > 0 ? `+${v}%` : `${v}%`} onChange={(v) => patch({ volume: v })} />
      <button type="button" className={advancedToggle} onClick={() => setAdvancedOpen((o) => !o)}>
        <ChevronSVG open={advancedOpen} />
        {t('advanced')}
      </button>
      {advancedOpen && (
        <div className={advancedPanel}>
          <div className={`${formGroup} mb-0`}>
            <label className={labelCls}>{t('baseUrl.label')} <span style={{ color: 'var(--accent)' }}>*</span></label>
            <div className={labelHint}>{t('baseUrl.hintAzure')}</div>
            <input className={inputCls} type="text" placeholder="eastasia" value={region} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
          </div>
        </div>
      )}
    </div>
  )
}
