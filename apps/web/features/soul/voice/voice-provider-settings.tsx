'use client'

import { useEffect, type ReactNode, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Headphones } from 'lucide-react'
import { VOICE_PROVIDER_CATALOG } from '@/data/voice-providers'
import { useCharactersContext } from '@/context/CharactersContext'
import { useVoiceProvider } from '@/hooks/useVoiceProvider'
import { LANG_LABELS, VOICE_GROUPS } from '@/data/kokoro-voices'
import { ELEVENLABS_MODELS, OPENAI_VOICES, OPENAI_MODELS, FISHAUDIO_MODELS, CARTESIA_MODELS } from '@/data/voice-models'
import { getCredentials, upsertCredential, testCredential } from '@/api/soul'
import { CredentialStatusBadge, statusFromCredential, type CredentialStatus } from '@/components/soul/credential-status-badge'
import { cn } from '@/lib/utils'

const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3',
  'text-[0.8125rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]',
  'transition-colors focus:border-[var(--border-default)]',
)

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M2 12h20M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10c-2.5-3-4-6.5-4-10s1.5-7 4-10z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
)

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 18v4M9 22h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const SpeedIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const SliderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[var(--text-tertiary)]" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 14h4M10 12h4M18 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

interface ParamRowProps {
  icon: ReactNode
  name: string
  desc: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  decimals: number
  format?: (v: number) => string
}

function ParamRow({ icon, name, desc, min, max, step, value, onChange, decimals, format }: ParamRowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="w-5 shrink-0">{icon}</span>
      <div className="w-52 shrink-0">
        <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--text-tertiary)]">{desc}</p>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--text-primary)]"
        style={{ background: `linear-gradient(to right, var(--text-primary) ${((value - min) / (max - min)) * 100}%, var(--border-subtle) ${((value - min) / (max - min)) * 100}%)` }}
      />
      <span className="w-[4.5rem] shrink-0 text-center text-[0.8125rem] text-[var(--text-primary)]">
        {format ? format(value) : value.toFixed(decimals)}
      </span>
    </div>
  )
}

function SelectField({
  label,
  hint,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string
  hint?: string
  value: string
  disabled?: boolean
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <div className="p-5">
      <div className="mb-2 flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
        <MicIcon />
        {label}
      </div>
      {hint && <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">{hint}</p>}
      <div className="relative">
        <select
          className={cn(inputCls, 'appearance-none cursor-pointer pr-8')}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-tertiary)]" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

function KokoroSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
              <GlobeIcon />
              Server URL
            </div>
            <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">Kokoro API endpoint (local server).</p>
            <input className={inputCls} type="text" placeholder="http://127.0.0.1:8880/v1" value={tts.baseUrl ?? ''} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
          </div>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField label="Voice" hint="Choose a Kokoro voice for synthesis." value={tts.voiceId ?? ''} onChange={(v) => patch({ voiceId: v || null })}>
            <option value="">— Select a voice —</option>
            {Array.from(VOICE_GROUPS.entries()).map(([lang, voices]) => (
              <optgroup key={lang} label={LANG_LABELS[lang] ?? lang}>
                {voices.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
              </optgroup>
            ))}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="Playback speed multiplier" min={0.5} max={2.0} step={0.05} decimals={2} value={tts.speed} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}

function ApiKeyConnectionPanel({ providerName, providerId }: { providerName: string; providerId: string }) {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const [inputKey, setInputKey]     = useState(selected?.tts?.apiKey ?? '')
  const [saving, setSaving]         = useState(false)
  const [testStatus, setTestStatus] = useState<CredentialStatus>('untested')
  const [testError, setTestError]   = useState<string | null>(null)

  useEffect(() => {
    getCredentials()
      .then((creds) => {
        const cred = creds.find((c) => c.providerId === providerId)
        if (cred?.hasKey) setTestStatus(statusFromCredential(cred.verifiedAt, cred.lastError))
      })
      .catch(() => {/* ignore */})
  }, [providerId])

  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  const handleSave = async () => {
    if (!inputKey.trim()) return
    setSaving(true)
    setTestStatus('testing')
    setTestError(null)
    try {
      await upsertCredential(providerId, inputKey)
      patch({ apiKey: inputKey })
      const result = await testCredential(providerId)
      setTestStatus(result.success ? 'verified' : 'failed')
      setTestError(result.error)
    } catch (err) {
      setTestStatus('failed')
      setTestError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
      <div className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
            <LockIcon />
            API Key
          </div>
          <CredentialStatusBadge status={testStatus} error={testError} />
        </div>
        <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">Enter your {providerName} API key to connect.</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSave() }}
            placeholder="sk-..."
            autoComplete="new-password"
            className={cn(inputCls, 'flex-1')}
          />
          <button
            type="button"
            disabled={saving || !inputKey.trim()}
            onClick={() => void handleSave()}
            className="h-9 shrink-0 rounded-lg bg-[var(--accent-primary)] px-4 text-[0.8125rem] font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ElevenLabsSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('elevenlabs', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="ElevenLabs" providerId="elevenlabs" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice & Model</h2>
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
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SliderIcon />} name="Stability" desc="Higher = more consistent, lower = more expressive" min={0} max={1} step={0.01} decimals={2} value={tts.stability} onChange={(v) => patch({ stability: v })} />
          <ParamRow icon={<SliderIcon />} name="Similarity Boost" desc="How closely the voice matches the original speaker" min={0} max={1} step={0.01} decimals={2} value={tts.similarityBoost} onChange={(v) => patch({ similarityBoost: v })} />
          <ParamRow icon={<SliderIcon />} name="Style" desc="Style exaggeration (0 recommended for most models)" min={0} max={1} step={0.01} decimals={2} value={tts.style} onChange={(v) => patch({ style: v })} />
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="Speech rate (0.7 - 1.2)" min={0.7} max={1.2} step={0.01} decimals={2} value={Math.min(1.2, Math.max(0.7, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <div className="flex items-center gap-4 px-5 py-4">
            <span className="w-5 shrink-0"><SliderIcon /></span>
            <div className="w-52 shrink-0">
              <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">Speaker Boost</p>
              <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--text-tertiary)]">Enhances speaker similarity</p>
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

function OpenAiSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="OpenAI" providerId="openai" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice & Model</h2>
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
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="0.25x to 4.0x (1.0 = normal)" min={0.25} max={4.0} step={0.05} decimals={2} value={Math.min(4.0, Math.max(0.25, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}

function OpenAiCompatibleSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
              <GlobeIcon />
              Base URL <span className="text-[var(--accent-base)]">*</span>
            </div>
            <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">OpenAI-compatible API endpoint (e.g. http://localhost:1234/v1).</p>
            <input className={inputCls} type="text" placeholder="http://localhost:1234/v1" value={tts.baseUrl ?? ''} onChange={(e) => patch({ baseUrl: e.target.value || null })} />
          </div>
          <div className="p-5">
            <div className="mb-2 flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
              <LockIcon />
              API Key
            </div>
            <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">Optional — only if the endpoint requires auth.</p>
            <input type="password" value={tts.apiKey ?? ''} onChange={(e) => patch({ apiKey: e.target.value || null })} placeholder="sk-..." autoComplete="new-password" className={inputCls} />
          </div>
        </div>
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice & Model</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <div className="p-5">
            <div className="mb-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">Voice ID</div>
            <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">Free-form voice identifier supported by your endpoint.</p>
            <input className={inputCls} type="text" placeholder="alloy" value={tts.voiceId ?? ''} onChange={(e) => patch({ voiceId: e.target.value || null })} />
          </div>
          <div className="p-5">
            <div className="mb-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">Model ID</div>
            <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">Free-form model identifier.</p>
            <input className={inputCls} type="text" placeholder="tts-1" value={tts.modelId ?? ''} onChange={(e) => patch({ modelId: e.target.value || null })} />
          </div>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="0.25x to 4.0x (1.0 = normal)" min={0.25} max={4.0} step={0.05} decimals={2} value={Math.min(4.0, Math.max(0.25, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}

function FishAudioSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('fishaudio', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="Fish Audio" providerId="fish-audio" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice & Model</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <SelectField
            label="Voice"
            hint={!apiKey.trim() ? 'Enter your API key to load voices.' : voicesLoading ? 'Loading voices...' : 'Select from your Fish Audio voices.'}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(v) => patch({ voiceId: v || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}</option>)}
          </SelectField>
          <SelectField label="Model" value={tts.modelId ?? 's2-pro'} onChange={(v) => patch({ modelId: v })}>
            {FISHAUDIO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </SelectField>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Parameters</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] divide-y divide-[var(--border-subtle)]">
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="Speech rate multiplier" min={0.5} max={2.0} step={0.05} decimals={2} value={Math.min(2.0, Math.max(0.5, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
        </div>
      </section>
    </>
  )
}

function CartesiaSettings() {
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

function GoogleCloudSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })
  const apiKey = tts.apiKey ?? ''
  const { voices, loading: voicesLoading } = useVoiceProvider('google-cloud-tts', apiKey)

  return (
    <>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Connection</h2>
        <ApiKeyConnectionPanel providerName="Google Cloud" providerId="google-cloud-tts" />
      </section>
      <section className="mb-6">
        <h2 className="mb-3 text-[0.9375rem] font-semibold text-[var(--text-heading)]">Voice</h2>
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <SelectField
            label="Voice"
            hint={!apiKey.trim() ? 'Enter your API key to load voices.' : voicesLoading ? 'Loading voices...' : 'Select from Google Cloud voices.'}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
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
          <ParamRow icon={<SliderIcon />} name="Pitch" desc="Adjust pitch in semitones" min={-20} max={20} step={0.5} decimals={1} value={tts.pitch} onChange={(v) => patch({ pitch: v })} format={(v) => v > 0 ? `+${v}` : `${v}`} />
          <ParamRow icon={<SpeedIcon />} name="Speed" desc="0.25x to 4.0x (1.0 = normal)" min={0.25} max={4.0} step={0.05} decimals={2} value={Math.min(4.0, Math.max(0.25, tts.speed))} onChange={(v) => patch({ speed: v })} format={(v) => `${v.toFixed(2)}×`} />
          <ParamRow icon={<SliderIcon />} name="Volume" desc="Volume gain in dB" min={-10} max={10} step={0.5} decimals={1} value={tts.volume} onChange={(v) => patch({ volume: v })} format={(v) => v > 0 ? `+${v} dB` : `${v} dB`} />
        </div>
      </section>
    </>
  )
}

const AZURE_REGIONS = [
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

function AzureSpeechSettings() {
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

function ProviderSettings({ providerId }: { providerId: string }) {
  switch (providerId) {
    case 'kokoro':            return <KokoroSettings />
    case 'elevenlabs':        return <ElevenLabsSettings />
    case 'openai':            return <OpenAiSettings />
    case 'openai-compatible': return <OpenAiCompatibleSettings />
    case 'fishaudio':         return <FishAudioSettings />
    case 'cartesia':          return <CartesiaSettings />
    case 'google-cloud-tts':  return <GoogleCloudSettings />
    case 'azure-speech':      return <AzureSpeechSettings />
    default:
      return <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">No settings available for this provider.</p>
  }
}

function GlobalParamRow({ name, desc, min, max, step, value, onChange, decimals }: {
  name: string; desc: string; min: number; max: number; step: number
  value: number; onChange: (v: number) => void; decimals: number
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 ml-8">
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-36 cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--text-primary)]"
          style={{ height: '4px', background: `linear-gradient(to right, var(--text-primary) ${pct}%, var(--border-subtle) ${pct}%)` }}
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={value.toFixed(decimals)}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] py-1 text-center text-[14px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-default)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}

function GlobalToggleRow({ name, desc, value, onChange }: {
  name: string; desc: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'h-[18px] w-[30px] shrink-0 rounded-[44px] p-[2px] outline-none ml-8',
          'transition-[background] duration-200',
          value ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-default)]',
        )}
      >
        <span className={cn(
          'block h-[14px] w-[14px] rounded-[44px] bg-white shadow-sm',
          'transition-transform duration-200 ease-out',
          value ? 'translate-x-[12px]' : 'translate-x-0',
        )} />
      </button>
    </div>
  )
}

export default function VoiceProviderSettings() {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const params = useParams<{ id: string; providerId: string }>()

  const catalog = VOICE_PROVIDER_CATALOG.find((p) => p.id === params.providerId)

  const tts = selected?.tts
  const [speed, setSpeed]                     = useState(tts?.speed ?? 1.0)
  const [pitch, setPitch]                     = useState(tts?.pitch ?? 0)
  const [volume, setVolume]                   = useState(tts?.volume ?? 0)
  const [stability, setStability]             = useState(tts?.stability ?? 0.5)
  const [similarityBoost, setSimilarityBoost] = useState(tts?.similarityBoost ?? 0.75)
  const [style, setStyle]                     = useState(tts?.style ?? 0.0)
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(tts?.useSpeakerBoost ?? false)

  const isElevenLabs = params.providerId === 'elevenlabs'

  if (!selected || !selectedId) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading...</div>
  }

  const handleSaveGlobal = () => {
    updateCharacter(selectedId, {
      tts: { ...selected.tts, speed, pitch, volume, stability, similarityBoost, style, useSpeakerBoost },
    })
  }

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-[1200px]">

        <nav className="mb-6 flex items-center gap-2 text-[14px] text-[var(--text-secondary)]">
          <Link href={`/souls/${params.id}/voice`} className="hover:text-[var(--text-primary)] transition-colors">
            Voice
          </Link>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)]">{catalog?.name ?? params.providerId}</span>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)]">Settings</span>
        </nav>

        <div className="flex items-start justify-between pb-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            {catalog && (
              <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                <img src={catalog.iconSrc} alt={catalog.name} className="h-full w-full object-contain" draggable={false} />
              </div>
            )}
            <div>
              <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
                {catalog?.name ?? params.providerId}
              </h1>
              <p className="mt-1 text-[14px] text-[var(--text-secondary)] max-w-md">
                {catalog?.description ?? 'Voice provider settings'}
              </p>
            </div>
          </div>
          {catalog && (catalog.supportUrl || catalog.websiteUrl) && (
            <div className="flex items-center gap-2 shrink-0 ml-6">
              {catalog.supportUrl && (
                <a
                  href={catalog.supportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3.5 py-2 text-[14px] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  <Headphones size={14} className="text-[var(--text-secondary)]" />
                  {catalog.name} Support
                </a>
              )}
              {catalog.websiteUrl && (
                <a
                  href={catalog.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--text-primary)] px-3.5 py-2 text-[14px] font-medium text-[var(--bg-0)] hover:opacity-90 transition-opacity"
                >
                  Open in {catalog.name}
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-[1fr_300px] gap-8 items-start">
          <div className="flex flex-col gap-5">
            <ProviderSettings providerId={params.providerId} />

            <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <div className="px-6 pt-5 pb-4">
                <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Global Voice Settings</h3>
                <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Applied across all providers.</p>
              </div>
              <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
                <GlobalParamRow name="Speed" desc="Speech rate multiplier" min={0.5} max={2.0} step={0.01} decimals={2} value={speed} onChange={setSpeed} />
                <GlobalParamRow name="Pitch" desc="Voice pitch adjustment in semitones" min={-50} max={50} step={1} decimals={0} value={pitch} onChange={setPitch} />
                <GlobalParamRow name="Volume" desc="Output volume adjustment in dB" min={-50} max={50} step={1} decimals={0} value={volume} onChange={setVolume} />
                {isElevenLabs && <>
                  <GlobalParamRow name="Stability" desc="Higher values produce more consistent, less expressive voice" min={0} max={1} step={0.01} decimals={2} value={stability} onChange={setStability} />
                  <GlobalParamRow name="Similarity Boost" desc="How closely the voice matches the original speaker" min={0} max={1} step={0.01} decimals={2} value={similarityBoost} onChange={setSimilarityBoost} />
                  <GlobalParamRow name="Style" desc="Style exaggeration — higher values amplify emotional expression" min={0} max={1} step={0.01} decimals={2} value={style} onChange={setStyle} />
                  <GlobalToggleRow name="Speaker Boost" desc="Enhanced speaker similarity at the cost of slightly higher latency" value={useSpeakerBoost} onChange={setUseSpeakerBoost} />
                </>}
              </div>
              <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleSaveGlobal}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-[14px] font-semibold text-[var(--bg-0)] hover:opacity-90 transition-opacity"
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">About</h3>
            </div>
            <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
              {catalog ? [
                { label: 'Provider', value: catalog.name },
                { label: 'Kind', value: catalog.kind },
                { label: 'API Key', value: catalog.requiresApiKey ? 'Required' : 'Not required' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-6 py-3">
                  <span className="text-[14px] text-[var(--text-secondary)]">{row.label}</span>
                  <span className="text-[14px] text-[var(--text-primary)]">{row.value}</span>
                </div>
              )) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
