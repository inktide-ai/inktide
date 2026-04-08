import { useEffect, useState } from 'react'
import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import kokoroLogo from '../../../assets/kokoro.png'
import elevenLabsLogo from '../../../assets/eleven_labs.svg'
import openaiLogo from '../../../assets/openai.svg'
import fishAudioLogo from '../../../assets/fish.svg'
import azureLogo from '../../../assets/microsoft_azure.svg'
import googleCloudLogo from '../../../assets/google_cloud.svg'
import cartesiaLogo from '../../../assets/cartesia.svg'
import type { AiCharacter } from '../../../domain/character'
import VoiceSandboxTab from './VoiceSandboxTab'
import { LANG_LABELS, VOICE_GROUPS } from '../../../domain/kokoroVoices'
import { getTtsVoices, type SpeechVoice } from '../../../api/tts'

// ── Provider registry ─────────────────────────────────────────────────────────
// To add a new provider: add one entry here + a case in renderSettingsPanel().

interface ProviderDef {
  id: string
  name: string
  description: string
  icon: string
  iconSrc?: string
  requiresApiKey: boolean
  hasSettings: boolean
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'none',
    name: 'None',
    description: 'No voice output.',
    icon: '🔇',
    requiresApiKey: false,
    hasSettings: false,
  },
  {
    id: 'kokoro',
    name: 'Kokoro',
    description: 'Local TTS — no API key required.',
    icon: '',
    iconSrc: kokoroLogo,
    requiresApiKey: false,
    hasSettings: true,
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    description: 'Cloud TTS — natural voices, API key required.',
    icon: '',
    iconSrc: elevenLabsLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
  {
    id: 'fishaudio',
    name: 'Fish Audio',
    description: 'Cloud TTS — voice cloning and multilingual voices, API key required.',
    icon: '',
    iconSrc: fishAudioLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI TTS — high-quality voices via api.openai.com.',
    icon: '',
    iconSrc: openaiLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible',
    description: 'Any OpenAI-format TTS API — custom endpoint, free model selection.',
    icon: '',
    iconSrc: openaiLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
  {
    id: 'cartesia',
    name: 'Cartesia',
    description: 'Cartesia Sonic — ultra-low latency neural TTS, API key required.',
    icon: '',
    iconSrc: cartesiaLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
  {
    id: 'google-cloud-tts',
    name: 'Google Cloud TTS',
    description: 'Google Cloud neural voices via gRPC — API key required.',
    icon: '',
    iconSrc: googleCloudLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
  {
    id: 'azure-speech',
    name: 'Microsoft Azure Speech',
    description: 'Azure Cognitive Services TTS — neural voices, API key + region required.',
    icon: '',
    iconSrc: azureLogo,
    requiresApiKey: true,
    hasSettings: true,
  },
]

// ── Shared slider helper ──────────────────────────────────────────────────────

interface SliderFieldProps {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  tickCount?: number
}

const SliderField = ({ label, hint, value, min, max, step, format, onChange, tickCount = 4 }: SliderFieldProps) => (
  <div className={styles.sliderGroup}>
    <div className={styles.sliderHeader}>
      <div className={styles.sliderLabelBlock}>
        <label className={styles.label}>{label}</label>
        {hint && <div className={styles.labelHint}>{hint}</div>}
      </div>
      <span className={styles.sliderValue}>{format(value)}</span>
    </div>
    <SliderWithTicks
      min={min} max={max} step={step}
      value={value}
      onChange={onChange}
      formatValue={format}
      tickCount={tickCount}
    />
  </div>
)

// ── KokoroPanel ───────────────────────────────────────────────────────────────

interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const KokoroPanel = ({ character, onUpdate }: PanelProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const tts = character.tts

  return (
    <div className={styles.infoCardContent}>
      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>Choose a Kokoro voice for synthesis</div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? ''}
            onChange={(e) => onUpdate({ tts: { ...tts, voiceId: e.target.value || null } })}
          >
            <option value="">— Select a voice —</option>
            {Array.from(VOICE_GROUPS.entries()).map(([lang, voices]) => (
              <optgroup key={lang} label={LANG_LABELS[lang] ?? lang}>
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>{v.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Speed */}
      <SliderField
        label="Speed" value={tts.speed} min={0.5} max={2.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => onUpdate({ tts: { ...tts, speed: v } })}
      />

      {/* Advanced */}
      <button type="button" className={styles.advancedToggle} onClick={() => setAdvancedOpen((o) => !o)}>
        <svg className={`${styles.advancedChevron} ${advancedOpen ? styles.advancedChevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Advanced
      </button>

      {advancedOpen && (
        <div className={styles.advancedPanel}>
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Base URL</label>
            <div className={styles.labelHint}>Kokoro API endpoint</div>
            <input
              className={styles.input} type="text"
              placeholder="http://127.0.0.1:8880/v1"
              value={tts.baseUrl ?? ''}
              onChange={(e) => onUpdate({ tts: { ...tts, baseUrl: e.target.value || null } })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── ElevenLabsPanel ───────────────────────────────────────────────────────────

const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2 (recommended)' },
  { id: 'eleven_turbo_v2_5',      label: 'Turbo v2.5 (low-latency)' },
  { id: 'eleven_flash_v2_5',      label: 'Flash v2.5 (fastest)' },
  { id: 'eleven_turbo_v2',        label: 'Turbo v2' },
  { id: 'eleven_monolingual_v1',  label: 'Monolingual v1 (EN only)' },
  { id: 'eleven_multilingual_v1', label: 'Multilingual v1' },
]

const ElevenLabsPanel = ({ character, onUpdate }: PanelProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''

  // Load voices whenever the API key changes (debounced)
  useEffect(() => {
    if (!apiKey.trim()) { setVoices([]); return }
    let cancelled = false
    const timer = setTimeout(() => {
      setVoicesLoading(true)
      getTtsVoices('elevenlabs', apiKey)
        .then((list) => { if (!cancelled) setVoices(list) })
        .catch(() => { if (!cancelled) setVoices([]) })
        .finally(() => { if (!cancelled) setVoicesLoading(false) })
    }, 600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [apiKey])

  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={styles.infoCardContent}>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>API Key for ElevenLabs</div>
        <input
          className={styles.input} type="password"
          placeholder="sk_…"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>
          {!apiKey.trim()
            ? 'Enter your API key to load available voices'
            : voicesLoading ? 'Loading voices…' : 'Select from your ElevenLabs voices'}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(e) => patch({ voiceId: e.target.value || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name ?? v.id}</option>)}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Model */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Model</label>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.modelId ?? 'eleven_multilingual_v2'}
            onChange={(e) => patch({ modelId: e.target.value })}
          >
            {ELEVENLABS_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Stability */}
      <SliderField
        label="Stability" hint="Higher = more consistent, lower = more expressive"
        value={tts.stability} min={0} max={1} step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patch({ stability: v })}
      />

      {/* Similarity Boost */}
      <SliderField
        label="Similarity Boost" hint="Усиление схожести с диктором"
        value={tts.similarityBoost} min={0} max={1} step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patch({ similarityBoost: v })}
      />

      {/* Style */}
      <SliderField
        label="Style" hint="Style exaggeration — 0 is recommended for most models"
        value={tts.style} min={0} max={1} step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => patch({ style: v })}
      />

      {/* Speed — clamped to 0.7–1.2 for ElevenLabs */}
      <SliderField
        label="Speed"
        value={Math.min(1.2, Math.max(0.7, tts.speed))} min={0.7} max={1.2} step={0.01}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

      {/* Pitch (UI only — stored but not sent to ElevenLabs) */}
      <SliderField
        label="Pitch" hint="Stored only — ElevenLabs does not support pitch adjustment"
        value={tts.pitch} min={0.5} max={2.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ pitch: v })}
      />

      {/* Volume (UI only — stored but not sent to ElevenLabs) */}
      <SliderField
        label="Volume" hint="Stored only — use your audio output settings for volume"
        value={tts.volume} min={0.1} max={2.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ volume: v })}
      />

      {/* Speaker Boost */}
      <div className={styles.toggleRow}>
        <div className={styles.toggleLabel}>
          Speaker Boost
          <div className={styles.toggleHint}>Ускорение динамиков — усиление схожести с диктором</div>
        </div>
        <label className={styles.toggleControl}>
          <input
            type="checkbox"
            checked={tts.useSpeakerBoost}
            onChange={(e) => patch({ useSpeakerBoost: e.target.checked })}
          />
          <div className={styles.control} />
        </label>
      </div>

      {/* Advanced */}
      <button type="button" className={styles.advancedToggle} onClick={() => setAdvancedOpen((o) => !o)}>
        <svg className={`${styles.advancedChevron} ${advancedOpen ? styles.advancedChevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Advanced
      </button>

      {advancedOpen && (
        <div className={styles.advancedPanel}>
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Base URL</label>
            <div className={styles.labelHint}>ElevenLabs API endpoint (override for enterprise)</div>
            <input
              className={styles.input} type="text"
              placeholder="https://api.elevenlabs.io"
              value={tts.baseUrl ?? ''}
              onChange={(e) => patch({ baseUrl: e.target.value || null })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ── OpenAiPanel ───────────────────────────────────────────────────────────────

const OPENAI_VOICES = [
  'alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse',
]

const OPENAI_MODELS = [
  { id: 'tts-1',           label: 'TTS-1 (standard, low-latency)' },
  { id: 'tts-1-hd',        label: 'TTS-1 HD (higher quality)' },
  { id: 'gpt-4o-mini-tts', label: 'GPT-4o Mini TTS' },
]

const OpenAiPanel = ({ character, onUpdate }: PanelProps) => {
  const tts = character.tts
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={styles.infoCardContent}>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>Your OpenAI API key (sk-…)</div>
        <input
          className={styles.input} type="password"
          placeholder="sk-…"
          autoComplete="new-password"
          value={tts.apiKey ?? ''}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>Select an OpenAI voice</div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? 'alloy'}
            onChange={(e) => patch({ voiceId: e.target.value })}
          >
            {OPENAI_VOICES.map((v) => (
              <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Model */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Model</label>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.modelId ?? 'tts-1'}
            onChange={(e) => patch({ modelId: e.target.value })}
          >
            {OPENAI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Speed */}
      <SliderField
        label="Speed" hint="0.25× – 4.0× (1.0 = normal)"
        value={Math.min(4.0, Math.max(0.25, tts.speed))} min={0.25} max={4.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

    </div>
  )
}

// ── OpenAiCompatiblePanel ─────────────────────────────────────────────────────

const OpenAiCompatiblePanel = ({ character, onUpdate }: PanelProps) => {
  const tts = character.tts
  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={styles.infoCardContent}>

      {/* Base URL (required) */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Base URL <span style={{ color: 'var(--accent)' }}>*</span></label>
        <div className={styles.labelHint}>OpenAI-compatible API endpoint (e.g. http://localhost:1234/v1)</div>
        <input
          className={styles.input} type="text"
          placeholder="http://localhost:1234/v1"
          value={tts.baseUrl ?? ''}
          onChange={(e) => patch({ baseUrl: e.target.value || null })}
        />
      </div>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>API key (leave blank if not required by the server)</div>
        <input
          className={styles.input} type="password"
          placeholder="sk-…"
          autoComplete="new-password"
          value={tts.apiKey ?? ''}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Voice (free text) */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>Voice name as accepted by the server</div>
        <input
          className={styles.input} type="text"
          placeholder="alloy"
          value={tts.voiceId ?? ''}
          onChange={(e) => patch({ voiceId: e.target.value || null })}
        />
      </div>

      {/* Model (free text) */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Model</label>
        <div className={styles.labelHint}>Model ID used by the server (default: tts-1)</div>
        <input
          className={styles.input} type="text"
          placeholder="tts-1"
          value={tts.modelId ?? ''}
          onChange={(e) => patch({ modelId: e.target.value || null })}
        />
      </div>

      {/* Speed */}
      <SliderField
        label="Speed" hint="0.25× – 4.0× (1.0 = normal)"
        value={Math.min(4.0, Math.max(0.25, tts.speed))} min={0.25} max={4.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

    </div>
  )
}

// ── FishAudioPanel ────────────────────────────────────────────────────────────

const FISHAUDIO_MODELS = [
  { id: 's2-pro', label: 'S2 Pro (recommended)' },
  { id: 's1',     label: 'S1 (standard)' },
]

const FishAudioPanel = ({ character, onUpdate }: PanelProps) => {
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''

  useEffect(() => {
    if (!apiKey.trim()) { setVoices([]); return }
    let cancelled = false
    const timer = setTimeout(() => {
      setVoicesLoading(true)
      getTtsVoices('fishaudio', apiKey)
        .then((list) => { if (!cancelled) setVoices(list) })
        .catch(() => { if (!cancelled) setVoices([]) })
        .finally(() => { if (!cancelled) setVoicesLoading(false) })
    }, 600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [apiKey])

  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  return (
    <div className={styles.infoCardContent}>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>Fish Audio API key</div>
        <input
          className={styles.input} type="password"
          placeholder="Bearer token from fish.audio"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>
          {!apiKey.trim()
            ? 'Enter your API key to load available voices'
            : voicesLoading ? 'Loading voices…' : 'Select from Fish Audio voices'}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(e) => patch({ voiceId: e.target.value || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}
              </option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Model */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Model</label>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.modelId ?? 's2-pro'}
            onChange={(e) => patch({ modelId: e.target.value })}
          >
            {FISHAUDIO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Speed */}
      <SliderField
        label="Speed" hint="0.5× – 2.0× (1.0 = normal)"
        value={Math.min(2.0, Math.max(0.5, tts.speed))} min={0.5} max={2.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

    </div>
  )
}

// ── CartesiaPanel ─────────────────────────────────────────────────────────────

const CARTESIA_MODELS = [
  { id: 'sonic-2',     label: 'Sonic 2 (latest, recommended)' },
  { id: 'sonic-turbo', label: 'Sonic Turbo (lowest latency)' },
]

const CartesiaPanel = ({ character, onUpdate }: PanelProps) => {
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''

  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  useEffect(() => {
    if (!apiKey.trim()) { setVoices([]); return }
    let cancelled = false
    const timer = setTimeout(() => {
      setVoicesLoading(true)
      getTtsVoices('cartesia', apiKey)
        .then((list) => { if (!cancelled) setVoices(list) })
        .catch(() => { if (!cancelled) setVoices([]) })
        .finally(() => { if (!cancelled) setVoicesLoading(false) })
    }, 600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [apiKey])

  return (
    <div className={styles.infoCardContent}>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>Cartesia API key (sk_car_…)</div>
        <input
          className={styles.input} type="password"
          placeholder="sk_car_…"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>
          {!apiKey.trim()
            ? 'Enter your API key to load available voices'
            : voicesLoading ? 'Loading voices…' : 'Select from your Cartesia voices'}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(e) => patch({ voiceId: e.target.value || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}
              </option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Model */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Model</label>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.modelId ?? 'sonic-2'}
            onChange={(e) => patch({ modelId: e.target.value })}
          >
            {CARTESIA_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Speed — Cartesia maps 0–2× to its internal -1–1 range */}
      <SliderField
        label="Speed" hint="0.0× – 2.0× (1.0 = normal)"
        value={Math.min(2.0, Math.max(0.0, tts.speed))} min={0.0} max={2.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

    </div>
  )
}

// ── GoogleCloudPanel ──────────────────────────────────────────────────────────

const GoogleCloudPanel = ({ character, onUpdate }: PanelProps) => {
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''

  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  useEffect(() => {
    if (!apiKey.trim()) { setVoices([]); return }
    let cancelled = false
    const timer = setTimeout(() => {
      setVoicesLoading(true)
      getTtsVoices('google-cloud-tts', apiKey)
        .then((list) => { if (!cancelled) setVoices(list) })
        .catch(() => { if (!cancelled) setVoices([]) })
        .finally(() => { if (!cancelled) setVoicesLoading(false) })
    }, 600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [apiKey])

  return (
    <div className={styles.infoCardContent}>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>Google Cloud API key with Text-to-Speech enabled</div>
        <input
          className={styles.input} type="password"
          placeholder="AIza…"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>
          {!apiKey.trim()
            ? 'Enter your API key to load available voices'
            : voicesLoading ? 'Loading voices…' : 'Select a Google Cloud neural voice'}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? ''}
            disabled={!apiKey.trim() || voicesLoading}
            onChange={(e) => patch({ voiceId: e.target.value || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}
              </option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Pitch — semitones, Google range -20 to +20 */}
      <SliderField
        label="Pitch" hint="Pitch adjustment in semitones (−20 to +20)"
        value={tts.pitch} min={-20} max={20} step={0.5}
        format={(v) => v > 0 ? `+${v}` : `${v}`}
        onChange={(v) => patch({ pitch: v })}
      />

      {/* Speed */}
      <SliderField
        label="Speed" hint="0.25× – 4.0× (1.0 = normal)"
        value={Math.min(4.0, Math.max(0.25, tts.speed))} min={0.25} max={4.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

      {/* Volume — dB gain, Google range -96 to +16, UI limited to ±10 */}
      <SliderField
        label="Volume" hint="Volume gain in dB (−10 to +10)"
        value={tts.volume} min={-10} max={10} step={0.5}
        format={(v) => v > 0 ? `+${v} dB` : `${v} dB`}
        onChange={(v) => patch({ volume: v })}
      />

    </div>
  )
}

// ── AzureSpeechPanel ──────────────────────────────────────────────────────────

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

const AzureSpeechPanel = ({ character, onUpdate }: PanelProps) => {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [voices, setVoices] = useState<SpeechVoice[]>([])
  const [voicesLoading, setVoicesLoading] = useState(false)
  const tts = character.tts
  const apiKey = tts.apiKey ?? ''
  const region = tts.baseUrl ?? ''

  const patch = (p: Partial<typeof tts>) => onUpdate({ tts: { ...tts, ...p } })

  // Load voices when both API key and region are present
  useEffect(() => {
    if (!apiKey.trim() || !region.trim()) { setVoices([]); return }
    let cancelled = false
    const timer = setTimeout(() => {
      setVoicesLoading(true)
      getTtsVoices('azure-speech', apiKey)
        .then((list) => { if (!cancelled) setVoices(list) })
        .catch(() => { if (!cancelled) setVoices([]) })
        .finally(() => { if (!cancelled) setVoicesLoading(false) })
    }, 600)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [apiKey, region])

  const canLoadVoices = apiKey.trim() && region.trim()

  return (
    <div className={styles.infoCardContent}>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>API Key</label>
        <div className={styles.labelHint}>API Key for Microsoft Azure Speech</div>
        <input
          className={styles.input} type="password"
          placeholder="Azure subscription key"
          autoComplete="new-password"
          value={apiKey}
          onChange={(e) => patch({ apiKey: e.target.value || null })}
        />
      </div>

      {/* Region */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Region <span style={{ color: 'var(--accent)' }}>*</span></label>
        <div className={styles.labelHint}>Azure Speech Service region</div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={AZURE_REGIONS.some((r) => r.code === region) ? region : '__custom__'}
            onChange={(e) => {
              if (e.target.value !== '__custom__') patch({ baseUrl: e.target.value })
            }}
          >
            <option value="__custom__" disabled={AZURE_REGIONS.some((r) => r.code === region)}>
              {AZURE_REGIONS.some((r) => r.code === region) ? '' : '— custom (see Advanced) —'}
            </option>
            {AZURE_REGIONS.map((r) => (
              <option key={r.code} value={r.code}>{r.label} ({r.code})</option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Voice */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Voice</label>
        <div className={styles.labelHint}>
          {!canLoadVoices
            ? 'Enter your API key and region to load available voices'
            : voicesLoading ? 'Loading voices…' : 'Select from Azure neural voices'}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={tts.voiceId ?? ''}
            disabled={!canLoadVoices || voicesLoading}
            onChange={(e) => patch({ voiceId: e.target.value || null })}
          >
            <option value="">— Select a voice —</option>
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name ?? v.id}{v.category ? ` · ${v.category}` : ''}
              </option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Pitch */}
      <SliderField
        label="Pitch" hint="Adjust synthesised speech pitch (higher/lower)"
        value={tts.pitch} min={-50} max={50} step={1}
        format={(v) => v > 0 ? `+${v}%` : `${v}%`}
        onChange={(v) => patch({ pitch: v })}
      />

      {/* Speed */}
      <SliderField
        label="Speed" hint="Speech rate adjustment"
        value={Math.min(MaxSpeed, Math.max(MinSpeed, tts.speed))} min={0.5} max={2.0} step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={(v) => patch({ speed: v })}
      />

      {/* Volume */}
      <SliderField
        label="Volume" hint="Speech volume adjustment"
        value={tts.volume} min={-50} max={50} step={1}
        format={(v) => v > 0 ? `+${v}%` : `${v}%`}
        onChange={(v) => patch({ volume: v })}
      />

      {/* Advanced */}
      <button type="button" className={styles.advancedToggle} onClick={() => setAdvancedOpen((o) => !o)}>
        <svg className={`${styles.advancedChevron} ${advancedOpen ? styles.advancedChevronOpen : ''}`}
          width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Advanced
      </button>

      {advancedOpen && (
        <div className={styles.advancedPanel}>
          <div className={styles.formGroup} style={{ marginBottom: 0 }}>
            <label className={styles.label}>Base URL <span style={{ color: 'var(--accent)' }}>*</span></label>
            <div className={styles.labelHint}>
              Region code (e.g. <code>eastasia</code>) or full endpoint URL.
              Overrides the region dropdown above.
            </div>
            <input
              className={styles.input} type="text"
              placeholder="eastasia"
              value={region}
              onChange={(e) => patch({ baseUrl: e.target.value || null })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

const MinSpeed = 0.5
const MaxSpeed = 2.0

// ── Dispatcher ────────────────────────────────────────────────────────────────
// Add a case here whenever a new provider with settings is added.

function renderSettingsPanel(
  providerId: string,
  character: AiCharacter,
  onUpdate: (patch: Partial<AiCharacter>) => void,
) {
  switch (providerId) {
    case 'kokoro':            return <KokoroPanel character={character} onUpdate={onUpdate} />
    case 'elevenlabs':        return <ElevenLabsPanel character={character} onUpdate={onUpdate} />
    case 'fishaudio':         return <FishAudioPanel character={character} onUpdate={onUpdate} />
    case 'openai':            return <OpenAiPanel character={character} onUpdate={onUpdate} />
    case 'openai-compatible': return <OpenAiCompatiblePanel character={character} onUpdate={onUpdate} />
    case 'cartesia':          return <CartesiaPanel character={character} onUpdate={onUpdate} />
    case 'google-cloud-tts':  return <GoogleCloudPanel character={character} onUpdate={onUpdate} />
    case 'azure-speech':      return <AzureSpeechPanel character={character} onUpdate={onUpdate} />
    default:
      return (
        <div style={{ padding: '1rem 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          No settings for this provider.
        </div>
      )
  }
}

// ── Main component ────────────────────────────────────────────────────────────

interface VoiceTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

type VoiceView =
  | { kind: 'grid' }
  | { kind: 'settings'; providerId: string }
  | { kind: 'sandbox' }

const VoiceTab = ({ character, onUpdate }: VoiceTabProps) => {
  const [view, setView] = useState<VoiceView>({ kind: 'grid' })
  const [search, setSearch] = useState('')

  // ── Sandbox view ───────────────────────────────────────────────────────────
  if (view.kind === 'sandbox') {
    return (
      <VoiceSandboxTab
        character={character}
        onBack={() => setView({ kind: 'grid' })}
      />
    )
  }

  // ── Settings view ──────────────────────────────────────────────────────────
  if (view.kind === 'settings') {
    const provider = PROVIDERS.find((p) => p.id === view.providerId)
    return (
      <div className={styles.tabRoot}>
        <div className={styles.providerPageHeader}>
          <button
            type="button"
            className={styles.providerBackBtn}
            onClick={() => setView({ kind: 'grid' })}
            aria-label="Back"
          >
            ←
          </button>
          <span className={styles.providerPageTitle}>
            {provider?.icon} {provider?.name ?? view.providerId} — Settings
          </span>
        </div>
        <div className={styles.section} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          {renderSettingsPanel(view.providerId, character, onUpdate)}
        </div>
      </div>
    )
  }

  // ── Grid view (main) ───────────────────────────────────────────────────────
  const filtered = PROVIDERS.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className={styles.tabRoot}>
      <div className={styles.pgHeaderCard}>
        <div className={styles.pgHeaderTitle}>Voice Providers</div>
        <div className={styles.pgHeaderDesc}>
          Choose a TTS provider for your AI character. Each provider can be configured
          individually — select a voice, adjust speed, and set any required credentials.
        </div>
      </div>

      <div className={styles.providerSearchWrap}>
        <svg className={styles.providerSearchIcon} width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.providerSearchInput}
          type="text"
          placeholder="Search providers…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.pgGrid}>
        {filtered.map((provider) => {
          const isActive = character.tts.providerId === provider.id
          return (
            <div
              key={provider.id}
              className={`${styles.pgCard} ${isActive ? styles.pgCardActive : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!isActive) {
                  onUpdate({ tts: { ...character.tts, providerId: provider.id, voiceId: null, modelId: null } })
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isActive) {
                  onUpdate({ tts: { ...character.tts, providerId: provider.id, voiceId: null, modelId: null } })
                }
              }}
            >
              <div className={styles.pgGhostIcon}>
                {provider.iconSrc
                  ? <img src={provider.iconSrc} alt={provider.name} style={{ width: '2.25rem', height: '2.25rem', objectFit: 'contain' }} />
                  : provider.icon}
              </div>
              <div className={styles.pgName}>{provider.name}</div>
              <div className={styles.pgDesc}>{provider.description}</div>
              <div className={styles.pgFooter}>
                <div className={`${styles.pgRadio} ${isActive ? styles.pgRadioActive : ''}`} />
                {provider.hasSettings && (
                  <button
                    type="button"
                    className={styles.pgConfigure}
                    onClick={(e) => {
                      e.stopPropagation()
                      setView({ kind: 'settings', providerId: provider.id })
                    }}
                  >
                    Configure →
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {/* Sandbox card — always visible, not filtered by search */}
        <div
          key="_sandbox"
          className={styles.pgCard}
          role="button"
          tabIndex={0}
          onClick={() => setView({ kind: 'sandbox' })}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') setView({ kind: 'sandbox' })
          }}
        >
          <div className={styles.pgGhostIcon}>🎙</div>
          <div className={styles.pgName}>Voice Sandbox</div>
          <div className={styles.pgDesc}>Test any provider in the browser — synthesis, streaming, and voice tuning.</div>
          <div className={styles.pgFooter}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Open →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceTab
