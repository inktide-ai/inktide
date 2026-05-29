'use client'

import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { OPENAI_VOICES, OPENAI_MODELS } from '@/shared/data/voice-models'
import { SpeedIcon } from '../voice-icons'
import { SelectField, ParamRow } from '../param-row'
import { ApiKeyConnectionPanel } from './api-key-panel'

export function OpenAiSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="OpenAI" providerId="openai" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">Voice & Model</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <SelectField label="Voice" hint="Select an OpenAI voice." value={tts.voiceId ?? 'alloy'} onChange={(v) => patch({ voiceId: v })}>
            {OPENAI_VOICES.map((v) => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </SelectField>
          <SelectField label="Model" value={tts.modelId ?? 'tts-1'} onChange={(v) => patch({ modelId: v })}>
            {OPENAI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-body-md font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="0.25x to 4.0x (1.0 = normal)" min={0.25} max={4.0} step={0.05} decimals={2} value={Math.min(4.0, Math.max(0.25, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}
