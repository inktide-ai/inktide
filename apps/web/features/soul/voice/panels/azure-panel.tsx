'use client'

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
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const region = tts.baseUrl ?? ''
  const canLoadVoices = apiKey.trim() && region.trim()
  const { voices, loading: voicesLoading } = useVoiceProvider('azure-speech', apiKey, region)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
              <LockIcon />
              API Key
            </div>
            <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">Azure Speech subscription key.</p>
            <input type="password" value={apiKey} onChange={(e) => patch({ apiKey: e.target.value || null })} placeholder="Azure subscription key" autoComplete="new-password" className={inputCls} />
          </div>
          <SelectField
            label="Region"
            hint="Azure Speech Service region."
            value={AZURE_REGIONS.some((r) => r.code === region) ? region : ''}
            onChange={(v) => patch({ baseUrl: v || null })}
          >
            <option value="">— Select a region —</option>
            {AZURE_REGIONS.map((r) => <option key={r.code} value={r.code}>{r.label} ({r.code})</option>)}
          </SelectField>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField
            label="Voice"
            hint={!canLoadVoices ? 'Enter API key and region to load voices.' : voicesLoading ? 'Loading voices...' : 'Select from Azure neural voices.'}
            value={tts.voiceId ?? ''}
            disabled={!canLoadVoices || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SliderIcon />} name="Pitch" desc="Adjust synthesized speech pitch" min={-50} max={50} step={1} decimals={0} value={tts.pitch} onChange={(v) => patch({ pitch: v })} format={(v) => v > 0 ? `+${v}%` : `${v}%`} />
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="Speech rate adjustment" min={0.5} max={2.0} step={0.05} decimals={2} value={Math.min(2.0, Math.max(0.5, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <ParamRow icon={<SliderIcon />} name="Volume" desc="Speech volume adjustment" min={-50} max={50} step={1} decimals={0} value={tts.volume} onChange={(v) => patch({ volume: v })} format={(v) => v > 0 ? `+${v}%` : `${v}%`} />
        </div>
      </section>
    </>
  )
}
