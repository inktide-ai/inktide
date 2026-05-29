'use client'

import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useVoiceProvider } from '@/features/soul/hooks/useVoiceProvider'
import { ELEVENLABS_MODELS } from '@/shared/data/voice-models'
import { SpeedIcon, SliderIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'
import { ApiKeyConnectionPanel } from './api-key-panel'

export function ElevenLabsSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('elevenlabs', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="ElevenLabs" providerId="elevenlabs" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">Voice & Model</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <SelectField
            label="Voice"
            hint={!apiKey.trim() ? 'Enter your API key to load voices.' : voicesLoading ? 'Loading voices...' : 'Select from your ElevenLabs voices.'}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
          </SelectField>
          <SelectField label="Model" value={tts.modelId ?? 'eleven_multilingual_v2'} onChange={(v) => patch({ modelId: v })}>
            {ELEVENLABS_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SliderIcon />} name="Stability" desc="Higher = more consistent, lower = more expressive" min={0} max={1} step={0.01} decimals={2} value={tts.stability} onChange={(v) => patch({ stability: v })} />
          <ParamRow icon={<SliderIcon />} name="Similarity Boost" desc="How closely the voice matches the original speaker" min={0} max={1} step={0.01} decimals={2} value={tts.similarityBoost} onChange={(v) => patch({ similarityBoost: v })} />
          <ParamRow icon={<SliderIcon />} name="Style" desc="Style exaggeration (0 recommended for most models)" min={0} max={1} step={0.01} decimals={2} value={tts.style} onChange={(v) => patch({ style: v })} />
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="Speech rate (0.7 - 1.2)" min={0.7} max={1.2} step={0.01} decimals={2} value={Math.min(1.2, Math.max(0.7, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="w-5 shrink-0"><SliderIcon /></span>
            <div className="w-52 shrink-0">
              <p className="text-body font-medium text-[var(--text-primary)]">Speaker Boost</p>
              <p className="mt-0.5 text-xs leading-snug text-[var(--text-tertiary)]">Enhances speaker similarity</p>
            </div>
            <div className="flex-1" />
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={tts.useSpeakerBoost} onChange={(e) => patch({ useSpeakerBoost: e.target.checked })} />
              <div className="h-5 w-9 rounded-full bg-[var(--border-default)] transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[var(--text-primary)] peer-checked:after:translate-x-4" />
            </label>
          </div>
        </div>
      </section>
    </>
  )
}
