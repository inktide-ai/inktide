'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, Headphones } from 'lucide-react'
import { VOICE_PROVIDER_CATALOG } from '@/shared/data/voice-providers'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { GlobalParamRow, GlobalToggleRow } from './param-row'
import { KokoroSettings } from './panels/kokoro-panel'
import { ElevenLabsSettings } from './panels/elevenlabs-panel'
import { OpenAiSettings } from './panels/openai-panel'
import { OpenAiCompatibleSettings } from './panels/openai-compatible-panel'
import { FishAudioSettings } from './panels/fish-audio-panel'
import { CartesiaSettings } from './panels/cartesia-panel'
import { GoogleCloudSettings } from './panels/google-cloud-panel'
import { AzureSpeechSettings } from './panels/azure-panel'

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

        <nav className="mb-6 flex items-center gap-2 text-body text-[var(--text-secondary)]">
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
              <p className="mt-1 text-body text-[var(--text-secondary)] max-w-md">
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
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3.5 py-2 text-body font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
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
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--text-primary)] px-3.5 py-2 text-body font-medium text-[var(--bg-0)] hover:opacity-90 transition-opacity"
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
                <p className="mt-1 text-body text-[var(--text-secondary)]">Applied across all providers.</p>
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
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-body font-semibold text-[var(--bg-0)] hover:opacity-90 transition-opacity"
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
                  <span className="text-body text-[var(--text-secondary)]">{row.label}</span>
                  <span className="text-body text-[var(--text-primary)]">{row.value}</span>
                </div>
              )) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
