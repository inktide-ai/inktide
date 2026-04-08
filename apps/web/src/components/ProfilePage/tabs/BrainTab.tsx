import { useEffect, useState } from 'react'
import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../../../domain/character'
import { getChatModels, type ChatModelInfo } from '../../../api/chat'

// ── Provider registry ─────────────────────────────────────────────────────────

interface LlmProviderDef {
  id: string
  name: string
  description: string
  icon: string
  hasSettings: boolean
}

const PROVIDERS: LlmProviderDef[] = [
  {
    id: 'ollama',
    name: 'Ollama',
    description: 'Local Ollama server — no API key required.',
    icon: '🦙',
    hasSettings: true,
  },
]

// ── Shared helpers ────────────────────────────────────────────────────────────

interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

// ── OllamaPanel ───────────────────────────────────────────────────────────────

const OllamaPanel = ({ character, onUpdate }: PanelProps) => {
  const [models, setModels] = useState<ChatModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState(false)

  const llm = character.llm
  const baseUrl = llm.baseUrl ?? 'http://localhost:11434'

  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  useEffect(() => {
    let cancelled = false
    setModelsError(false)
    const timer = setTimeout(() => {
      setModelsLoading(true)
      getChatModels('ollama', baseUrl)
        .then((list) => { if (!cancelled) { setModels(list); setModelsError(false) } })
        .catch(() => { if (!cancelled) { setModels([]); setModelsError(true) } })
        .finally(() => { if (!cancelled) setModelsLoading(false) })
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [baseUrl])

  return (
    <div className={styles.infoCardContent}>

      {/* Base URL */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Base URL</label>
        <div className={styles.labelHint}>URL of your Ollama server (default: http://localhost:11434)</div>
        <input
          className={styles.input}
          type="text"
          placeholder="http://localhost:11434"
          value={baseUrl}
          onChange={(e) => patch({ baseUrl: e.target.value || null })}
        />
      </div>

      {/* Model */}
      <div className={styles.formGroup}>
        <label className={styles.label}>Model</label>
        <div className={styles.labelHint}>
          {modelsLoading
            ? 'Loading models…'
            : modelsError
              ? 'Could not reach Ollama. Check base URL and that the server is running.'
              : models.length === 0
                ? 'No models found. Pull a model with: ollama pull llama3.1'
                : 'Select a model from your local Ollama instance'}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={llm.modelId ?? ''}
            disabled={modelsLoading || models.length === 0}
            onChange={(e) => patch({ modelId: e.target.value || null })}
          >
            <option value="">— Select a model —</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

    </div>
  )
}

// ── LLM Parameters panel ──────────────────────────────────────────────────────

const LlmParametersPanel = ({ character, onUpdate }: PanelProps) => {
  const llm = character.llm
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  return (
    <div className={styles.infoCardContent}>
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>Temperature</label>
            <div className={styles.labelHint}>Higher values make output more random and creative</div>
          </div>
          <span className={styles.sliderValue}>{llm.temperature.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={2} step={0.05} value={llm.temperature}
          onChange={(v) => patch({ temperature: v })}
          formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>Max tokens</label>
            <div className={styles.labelHint}>Maximum length of the generated response</div>
          </div>
          <span className={styles.sliderValue}>{llm.maxTokens}</span>
        </div>
        <SliderWithTicks min={64} max={4096} step={64} value={llm.maxTokens}
          onChange={(v) => patch({ maxTokens: v })}
          formatValue={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} tickCount={5} />
      </div>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>Top P</label>
            <div className={styles.labelHint}>Nucleus sampling — controls diversity of output</div>
          </div>
          <span className={styles.sliderValue}>{llm.topP.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={1} step={0.05} value={llm.topP}
          onChange={(v) => patch({ topP: v })}
          formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>Frequency penalty</label>
            <div className={styles.labelHint}>Reduces repetition of the same phrases</div>
          </div>
          <span className={styles.sliderValue}>{llm.frequencyPenalty.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={2} step={0.05} value={llm.frequencyPenalty}
          onChange={(v) => patch({ frequencyPenalty: v })}
          formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>

      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>Presence penalty</label>
            <div className={styles.labelHint}>Encourages talking about new topics</div>
          </div>
          <span className={styles.sliderValue}>{llm.presencePenalty.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={2} step={0.05} value={llm.presencePenalty}
          onChange={(v) => patch({ presencePenalty: v })}
          formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>
    </div>
  )
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

function renderSettingsPanel(
  providerId: string,
  character: AiCharacter,
  onUpdate: (patch: Partial<AiCharacter>) => void,
) {
  switch (providerId) {
    case 'ollama': return <OllamaPanel character={character} onUpdate={onUpdate} />
    default:       return null
  }
}

// ── Main component ────────────────────────────────────────────────────────────

interface BrainTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

type BrainView =
  | { kind: 'grid' }
  | { kind: 'settings'; providerId: string }

const BrainTab = ({ character, onUpdate }: BrainTabProps) => {
  const [view, setView] = useState<BrainView>({ kind: 'grid' })
  const [search, setSearch] = useState('')

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

        <div className={styles.section}>
          <div className={styles.sectionTitle}>LLM Parameters</div>
          <div className={styles.infoCard}>
            <LlmParametersPanel character={character} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    )
  }

  // ── Grid view ──────────────────────────────────────────────────────────────
  const filtered = PROVIDERS.filter(
    (p) =>
      !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className={styles.tabRoot}>
      <div className={styles.pgHeaderCard}>
        <div className={styles.pgHeaderTitle}>Brain Providers</div>
        <div className={styles.pgHeaderDesc}>
          Choose an LLM provider for your AI character. Each provider can be configured
          individually — select a model and set any required credentials.
        </div>
      </div>

      <div className={styles.providerSearchWrap}>
        <svg className={styles.providerSearchIcon} width="15" height="15" viewBox="0 0 15 15" fill="none">
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
          const isActive = character.llm.providerId === provider.id
          return (
            <div
              key={provider.id}
              className={`${styles.pgCard} ${isActive ? styles.pgCardActive : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!isActive) onUpdate({ llm: { ...character.llm, providerId: provider.id } })
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !isActive)
                  onUpdate({ llm: { ...character.llm, providerId: provider.id } })
              }}
            >
              <div className={styles.pgGhostIcon}>{provider.icon}</div>
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
                      onUpdate({ llm: { ...character.llm, providerId: provider.id } })
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
      </div>
    </div>
  )
}

export default BrainTab
