'use client'

import { useTranslation } from 'react-i18next'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { LockIcon, SliderIcon, SpeedIcon } from '../voice-icons'
import { inputCls, SelectField, ParamRow } from '../param-row'

export const AZURE_REGIONS = [
  { code: 'eastus',        label: 'East US' },
  { code: 'eastus2',       label: 'East US 2' },
  { code: 'westus',        label: 'West US' },
  { code: 'westus2',       label: 'West US 2' },
  { code: 'westus3',       label: 'West US 3' },
  { code: 'northeurope',   label: 'North Europe' },
  { code: 'westeurope',    label: 'West Europe' },
  { code: 'uksouth',       label: 'UK South' },
  { code: 'eastasia',      label: 'East Asia' },
  { code: 'southeastasia', label: 'Southeast Asia' },
  { code: 'japaneast',     label: 'Japan East' },
  { code: 'australiaeast', label: 'Australia East' },
]

export function AzureSpeechSettings() {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  // Hooks must run on every render: the early return below would
  // otherwise change the hook order once a character is selected.
  const apiKey = selected?.tts.apiKey ?? ''
  const region = selected?.tts.baseUrl ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('azure-speech', apiKey, region)

  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const canLoadVoices = apiKey.trim() && region.trim()

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.connection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <LockIcon />
              {t('panels.apiKey')}
            </div>
            <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('panels.azureKeyDesc')}</p>
            <input type="password" value={apiKey} onChange={(e) => patch({ apiKey: e.target.value || null })} placeholder={t('panels.azureKeyPlaceholder')} autoComplete="new-password" className={inputCls} />
          </div>
          <SelectField
            label={t('panels.region')}
            hint={t('panels.azureRegionDesc')}
            value={AZURE_REGIONS.some((r) => r.code === region) ? region : ''}
            onChange={(v) => patch({ baseUrl: v || null })}
          >
            <option value="">{t('panels.selectRegion')}</option>
            {AZURE_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.label} ({r.code})</option>)}
          </SelectField>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.voiceSection')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField
            label={t('panels.voice')}
            hint={!canLoadVoices ? t('panels.hintEnterKeyRegion') : voicesLoading ? t('panels.loadingVoices') : t('panels.hintAzureVoices')}
            value={tts.voiceId ?? ''}
            disabled={!canLoadVoices || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">{t('panels.selectVoice')}</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">{t('panels.parameters')}</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SliderIcon />} name={t('panels.pitch')} desc={t('panels.pitchAdjust')} min={-50} max={50} step={1} decimals={0} value={tts.pitch} onChange={(v) => patch({ pitch: v })} format={(v) => v > 0 ? `+${v}%` : `${v}%`} />
          <ParamRow icon={<SpeedIcon />} name={t('panels.speed')} desc={t('panels.speedRate')} min={0.5} max={2.0} step={0.05} decimals={2} value={Math.min(2.0, Math.max(0.5, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <ParamRow icon={<SliderIcon />} name={t('panels.volume')} desc={t('panels.volumeAdjust')} min={-50} max={50} step={1} decimals={0} value={tts.volume} onChange={(v) => patch({ volume: v })} format={(v) => v > 0 ? `+${v}%` : `${v}%`} />
        </div>
      </section>
    </>
  )
}
