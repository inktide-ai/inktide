'use client'

import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { CARTESIA_MODELS } from '@/shared/data/voice-models'
import { SpeedIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'
import { ApiKeyConnectionPanel } from './api-key-panel'

export function CartesiaSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('cartesia', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="Cartesia" providerId="cartesia" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice & Model</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <SelectField
            label="Voice"
            hint={!apiKey.trim() ? 'Enter your API key to load voices.' : voicesLoading ? 'Loading voices...' : 'Select from Cartesia voices.'}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </SelectField>
          <SelectField label="Model" value={tts.modelId ?? 'sonic-2'} onChange={(v) => patch({ modelId: v })}>
            {CARTESIA_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="Playback speed multiplier" min={0.0} max={2.0} step={0.05} decimals={2} value={Math.min(2.0, Math.max(0.0, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}
