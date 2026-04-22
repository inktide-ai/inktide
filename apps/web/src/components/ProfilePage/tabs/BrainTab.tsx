import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styles from '../ProfilePage.module.css'
import SliderWithTicks from '../SliderWithTicks'
import type { AiCharacter } from '../../../domain/character'
import { getChatModels, type ChatModelInfo } from '../../../api/chat'
import {
  getCatalogLlmModels,
  getCredentials,
  upsertCredential,
  type LlmModelResponse,
  type CredentialResponse,
} from '../../../api/soul'
import { PROVIDER_DEFS } from '../../../constants/providerDefs'
import { useCharactersContext } from '../../../context/CharactersContext'

// ── Network ping helpers ───────────────────────────────────────────────────────

async function pingOllama(baseUrl: string): Promise<string | null> {
  try {
    const url = baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '')
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) return null
    return `Server returned ${res.status}`
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('cors'))
      return 'CORS — launch Ollama with OLLAMA_ORIGINS=* ollama serve'
    return `Cannot reach ${baseUrl}`
  }
}

async function pingRemote(fixedUrl: string, apiKey: string): Promise<string | null> {
  if (!apiKey.trim()) return 'API key is required.'
  try {
    const res = await fetch(`${fixedUrl.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok || res.status === 401) return null
    return `Server returned ${res.status}`
  } catch {
    return `Cannot reach ${fixedUrl}`
  }
}

// ── Shared types ───────────────────────────────────────────────────────────────

interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

type AutoState   = 'idle' | 'ok' | 'failed'
type ManualState = 'idle' | 'testing' | 'ok' | 'failed'

// ── OllamaPanel ───────────────────────────────────────────────────────────────

const OllamaPanel = ({ character, onUpdate }: PanelProps) => {
  const { t } = useTranslation(['brain', 'providers'])
  const { registerSavePlugin, unregisterSavePlugin, markCredentialDirty } = useCharactersContext()

  const llm = character.llm
  const def = PROVIDER_DEFS.find((p) => p.id === 'ollama')!
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  const [cred, setCred]               = useState<CredentialResponse | null>(null)
  const [credLoading, setCredLoading] = useState(true)
  const [baseUrl, setBaseUrl]         = useState('')
  const [extraConfig, setExtraConfig] = useState<Record<string, unknown>>({})
  const [kvPairs, setKvPairs]         = useState<Record<string, [string, string][]>>({})

  const [autoState, setAutoState]     = useState<AutoState>('idle')
  const [autoError, setAutoError]     = useState<string | null>(null)
  const [manualState, setManualState] = useState<ManualState>('idle')
  const [manualError, setManualError] = useState<string | null>(null)
  const [bypassed, setBypassed]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [models, setModels]               = useState<ChatModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError]     = useState(false)

  // Refs so the save plugin always captures the latest values
  const baseUrlRef    = useRef(baseUrl)
  const extraRef      = useRef(extraConfig)
  const kvRef         = useRef(kvPairs)
  baseUrlRef.current  = baseUrl
  extraRef.current    = extraConfig
  kvRef.current       = kvPairs

  // Register save plugin — fires when user clicks global Save Changes
  useEffect(() => {
    const key = 'ollama-credential'
    registerSavePlugin(key, async () => {
      const configObj: Record<string, unknown> = { ...extraRef.current }
      def.extraFields?.forEach((f) => {
        if (f.type === 'kv-pairs') {
          const pairs = kvRef.current[f.key] ?? []
          if (pairs.length > 0)
            configObj[f.key] = Object.fromEntries(pairs.filter(([k]) => k.trim()))
        }
      })
      await upsertCredential(
        'ollama', null,
        baseUrlRef.current.trim() || null,
        Object.keys(configObj).length ? configObj : null,
      )
      const list = await getCredentials()
      setCred(list.find((c) => c.providerId === 'ollama') ?? null)
    })
    return () => unregisterSavePlugin(key)
  }, [registerSavePlugin, unregisterSavePlugin, def])

  // Load credential
  useEffect(() => {
    getCredentials()
      .then((list) => {
        const found = list.find((c) => c.providerId === 'ollama') ?? null
        setCred(found)
        setBaseUrl(found?.baseUrl ?? def.defaultBaseUrl ?? '')

        if (found?.config) {
          try {
            const parsed = JSON.parse(found.config) as Record<string, unknown>
            const newExtra: Record<string, unknown> = {}
            const newKv: Record<string, [string, string][]> = {}
            def.extraFields?.forEach((f) => {
              if (f.type === 'kv-pairs') {
                const val = parsed[f.key]
                if (val && typeof val === 'object' && !Array.isArray(val))
                  newKv[f.key] = Object.entries(val as Record<string, string>)
              } else if (parsed[f.key] !== undefined) {
                newExtra[f.key] = parsed[f.key]
              }
            })
            setExtraConfig(newExtra)
            setKvPairs(newKv)
          } catch {}
        } else {
          const defaults: Record<string, unknown> = {}
          def.extraFields?.forEach((f) => {
            if (f.type !== 'kv-pairs' && f.default !== undefined) defaults[f.key] = f.default
          })
          setExtraConfig(defaults)
        }
      })
      .catch(() => {})
      .finally(() => setCredLoading(false))
  }, [def])

  // Model fetch
  const effectiveBaseUrl = baseUrl || def.defaultBaseUrl || 'http://localhost:11434'
  useEffect(() => {
    if (credLoading) return
    let cancelled = false
    setModelsError(false)
    const timer = setTimeout(() => {
      setModelsLoading(true)
      getChatModels('ollama', effectiveBaseUrl)
        .then((list) => { if (!cancelled) { setModels(list); setModelsError(false) } })
        .catch(() => { if (!cancelled) { setModels([]); setModelsError(true) } })
        .finally(() => { if (!cancelled) setModelsLoading(false) })
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [effectiveBaseUrl, credLoading])

  const triggerAutoValidation = (url: string) => {
    setBypassed(false); setManualState('idle'); setManualError(null)
    setAutoState('idle'); setAutoError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const err = def.autoValidate({ apiKey: '', baseUrl: url })
      setAutoState(err ? 'failed' : 'ok'); setAutoError(err)
    }, 300)
  }

  const handleBaseUrlChange = (v: string) => {
    setBaseUrl(v); markCredentialDirty(); triggerAutoValidation(v)
  }

  const handleExtraChange = (key: string, value: unknown) => {
    setExtraConfig((p) => ({ ...p, [key]: value })); markCredentialDirty()
  }

  const handleTest = async () => {
    setManualState('testing'); setManualError(null); setBypassed(false)
    const err = await pingOllama(effectiveBaseUrl)
    setManualState(err ? 'failed' : 'ok'); setManualError(err)
  }

  return (
    <div className={styles.infoCardContent}>

      {/* Status */}
      <div className={styles.formGroup}>
        <label className={styles.label}>{t('providers:detail.status')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span className={cred ? styles.statusDotActive : styles.statusDotInactive} />
          <span className={styles.pgStatusLabel}>
            {cred ? t('providers:status.connected') : t('providers:status.notConnected')}
          </span>
        </div>
      </div>

      {/* Base URL */}
      <div className={styles.formGroup}>
        <label className={styles.label}>{t('brain:baseUrl.label')}</label>
        <div className={styles.labelHint}>{t('brain:baseUrl.hint')}</div>
        <input
          className={styles.input}
          type="text"
          placeholder={def.defaultBaseUrl}
          value={baseUrl}
          onChange={(e) => handleBaseUrlChange(e.target.value)}
        />
      </div>

      {/* Auto-validation (format check) */}
      {autoState === 'ok' && (
        <div className={styles.validationBanner} data-state="ok">✓ {t('providers:validation.autoOk')}</div>
      )}
      {autoState === 'failed' && !bypassed && (
        <div className={styles.validationBanner} data-state="failed">
          <div className={styles.validationTitle}>{autoError}</div>
        </div>
      )}

      {/* Test connection */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button type="button" className={styles.btnTest}
          disabled={manualState === 'testing' || autoState === 'failed'}
          onClick={handleTest}>
          {manualState === 'testing' ? t('providers:validation.checking') : t('providers:validation.testConnection')}
        </button>
      </div>
      {manualState === 'ok' && (
        <div className={styles.validationBanner} data-state="ok">✓ {t('providers:validation.ok')}</div>
      )}
      {manualState === 'failed' && !bypassed && (
        <div className={styles.validationBanner} data-state="failed">
          <div className={styles.validationTitle}>{t('providers:validation.failed')}</div>
          {manualError && <pre className={styles.validationMsg}>{manualError}</pre>}
          <button type="button" className={styles.btnContinueAnyway} onClick={() => setBypassed(true)}>
            {t('providers:validation.continueAnyway')}
          </button>
        </div>
      )}

      {/* Model picker — right under Base URL */}
      <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <label className={styles.label}>{t('brain:model.label')}</label>
        <div className={styles.labelHint}>
          {modelsLoading ? t('brain:model.loading')
            : modelsError ? t('brain:model.error')
            : models.length === 0 ? t('brain:model.empty')
            : t('brain:model.hint')}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={llm.modelId ?? ''}
            disabled={modelsLoading || models.length === 0}
            onChange={(e) => patch({ modelId: e.target.value || null })}
          >
            <option value="">{t('brain:model.selectPlaceholder')}</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <svg className={styles.voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Custom Headers (kv-pairs) */}
      {def.extraFields?.filter((f) => f.type === 'kv-pairs').map((field) => {
        const pairs = kvPairs[field.key] ?? []
        return (
          <div key={field.key} className={styles.formGroup}>
            <label className={styles.label}>{field.label}</label>
            {field.hint && <div className={styles.labelHint}>{field.hint}</div>}
            {pairs.map(([k, v], i) => (
              <div key={i} className={styles.kvRow}>
                <input className={styles.input} type="text" placeholder="Header" value={k}
                  onChange={(e) => {
                    const next = pairs.map((p, j): [string, string] => j === i ? [e.target.value, p[1]] : p)
                    setKvPairs((prev) => ({ ...prev, [field.key]: next })); markCredentialDirty()
                  }} />
                <input className={styles.input} type="text" placeholder="Value" value={v}
                  onChange={(e) => {
                    const next = pairs.map((p, j): [string, string] => j === i ? [p[0], e.target.value] : p)
                    setKvPairs((prev) => ({ ...prev, [field.key]: next })); markCredentialDirty()
                  }} />
                <button type="button" className={styles.kvRemoveBtn}
                  onClick={() => { setKvPairs((prev) => ({ ...prev, [field.key]: pairs.filter((_, j) => j !== i) })); markCredentialDirty() }}>✕</button>
              </div>
            ))}
            <button type="button" className={styles.kvAddBtn}
              onClick={() => { setKvPairs((prev) => ({ ...prev, [field.key]: [...pairs, ['', '']] })); markCredentialDirty() }}>
              + {t('providers:detail.addHeader')}
            </button>
          </div>
        )
      })}

      {/* Select fields (thinkingMode, etc.) */}
      {def.extraFields?.filter((f) => f.type === 'select').map((field) => (
        <div key={field.key} className={styles.formGroup}>
          <label className={styles.label}>{field.label}</label>
          {field.hint && <div className={styles.labelHint}>{field.hint}</div>}
          <select
            className={styles.input}
            value={String(extraConfig[field.key] ?? field.default ?? '')}
            onChange={(e) => handleExtraChange(field.key, e.target.value)}
          >
            {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ))}

    </div>
  )
}

// ── RemoteProviderPanel ───────────────────────────────────────────────────────

const RemoteProviderPanel = ({ providerId, character, onUpdate }: PanelProps & { providerId: string }) => {
  const { t } = useTranslation(['brain', 'providers'])
  const { registerSavePlugin, unregisterSavePlugin, markCredentialDirty } = useCharactersContext()

  const llm   = character.llm
  const def   = PROVIDER_DEFS.find((p) => p.id === providerId)
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  const [cred, setCred]   = useState<CredentialResponse | null>(null)
  const [apiKey, setApiKey] = useState('')

  const [autoState, setAutoState]     = useState<AutoState>('idle')
  const [autoError, setAutoError]     = useState<string | null>(null)
  const [manualState, setManualState] = useState<ManualState>('idle')
  const [manualError, setManualError] = useState<string | null>(null)
  const [bypassed, setBypassed]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [models, setModels]               = useState<LlmModelResponse[]>([])
  const [modelsLoading, setModelsLoading] = useState(true)

  const apiKeyRef    = useRef(apiKey)
  apiKeyRef.current  = apiKey

  useEffect(() => {
    const key = `${providerId}-credential`
    registerSavePlugin(key, async () => {
      const k = apiKeyRef.current.trim()
      if (!k) return  // don't overwrite existing key with empty
      await upsertCredential(providerId, k, def?.fixedBaseUrl ?? null)
      setApiKey('')
      const list = await getCredentials()
      setCred(list.find((c) => c.providerId === providerId) ?? null)
    })
    return () => unregisterSavePlugin(key)
  }, [providerId, def, registerSavePlugin, unregisterSavePlugin])

  useEffect(() => {
    getCredentials()
      .then((list) => setCred(list.find((c) => c.providerId === providerId) ?? null))
      .catch(() => {})
  }, [providerId])

  useEffect(() => {
    getCatalogLlmModels()
      .then((all) => setModels(all.filter((m) => m.provider === providerId)))
      .catch(() => setModels([]))
      .finally(() => setModelsLoading(false))
  }, [providerId])

  const triggerAutoValidation = (key: string) => {
    setBypassed(false); setManualState('idle'); setManualError(null)
    setAutoState('idle'); setAutoError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!def) return
    debounceRef.current = setTimeout(() => {
      const err = def.autoValidate({ apiKey: key, baseUrl: def.fixedBaseUrl ?? '' })
      setAutoState(err ? 'failed' : 'ok'); setAutoError(err)
    }, 300)
  }

  const handleApiKeyChange = (v: string) => {
    setApiKey(v); markCredentialDirty(); triggerAutoValidation(v)
  }

  const handleTest = async () => {
    if (!def?.fixedBaseUrl) return
    setManualState('testing'); setManualError(null); setBypassed(false)
    const err = await pingRemote(def.fixedBaseUrl, apiKey)
    setManualState(err ? 'failed' : 'ok'); setManualError(err)
  }

  return (
    <div className={styles.infoCardContent}>

      {/* Status */}
      <div className={styles.formGroup}>
        <label className={styles.label}>{t('providers:detail.status')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span className={cred?.hasKey ? styles.statusDotActive : styles.statusDotInactive} />
          <span className={styles.pgStatusLabel}>
            {cred?.hasKey ? t('providers:status.connected') : t('providers:status.notConnected')}
          </span>
        </div>
      </div>

      {/* API Key */}
      <div className={styles.formGroup}>
        <label className={styles.label}>{t('providers:detail.apiKey.label')}</label>
        <div className={styles.labelHint}>
          {cred?.hasKey ? t('providers:detail.apiKey.replaceHint') : t('providers:detail.apiKey.hint')}
        </div>
        <input
          className={styles.input}
          type="password"
          placeholder="sk-…"
          value={apiKey}
          onChange={(e) => handleApiKeyChange(e.target.value)}
        />
      </div>

      {/* Auto-validation */}
      {autoState === 'ok' && (
        <div className={styles.validationBanner} data-state="ok">✓ {t('providers:validation.autoOk')}</div>
      )}
      {autoState === 'failed' && !bypassed && (
        <div className={styles.validationBanner} data-state="failed">
          <div className={styles.validationTitle}>{autoError}</div>
        </div>
      )}

      {/* Test connection */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button type="button" className={styles.btnTest}
          disabled={manualState === 'testing' || !apiKey.trim()}
          onClick={handleTest}>
          {manualState === 'testing' ? t('providers:validation.checking') : t('providers:validation.testConnection')}
        </button>
      </div>

      {manualState === 'ok' && (
        <div className={styles.validationBanner} data-state="ok">✓ {t('providers:validation.ok')}</div>
      )}
      {manualState === 'failed' && !bypassed && (
        <div className={styles.validationBanner} data-state="failed">
          <div className={styles.validationTitle}>{t('providers:validation.failed')}</div>
          {manualError && <pre className={styles.validationMsg}>{manualError}</pre>}
          <button type="button" className={styles.btnContinueAnyway} onClick={() => setBypassed(true)}>
            {t('providers:validation.continueAnyway')}
          </button>
        </div>
      )}

      {/* Model picker */}
      <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <label className={styles.label}>{t('brain:model.label')}</label>
        <div className={styles.labelHint}>
          {modelsLoading ? t('brain:model.loading') : models.length === 0 ? t('brain:model.empty') : t('brain:model.hint')}
        </div>
        <div className={styles.voiceSelectWrap}>
          <select
            className={styles.voiceSelect}
            value={llm.modelId ?? ''}
            disabled={modelsLoading || models.length === 0}
            onChange={(e) => patch({ modelId: e.target.value || null })}
          >
            <option value="">{t('brain:model.selectPlaceholder')}</option>
            {models.map((m) => <option key={m.id} value={m.model_id}>{m.display_name}</option>)}
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
  const { t } = useTranslation(['behavior'])
  const llm = character.llm
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  return (
    <div className={styles.infoCardContent}>
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>{t('behavior:llm.temperature.label')}</label>
            <div className={styles.labelHint}>{t('behavior:llm.temperature.hint')}</div>
          </div>
          <span className={styles.sliderValue}>{llm.temperature.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={2} step={0.05} value={llm.temperature}
          onChange={(v) => patch({ temperature: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>{t('behavior:llm.maxTokens.label')}</label>
            <div className={styles.labelHint}>{t('behavior:llm.maxTokens.hint')}</div>
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
            <label className={styles.label}>{t('behavior:llm.topP.label')}</label>
            <div className={styles.labelHint}>{t('behavior:llm.topP.hint')}</div>
          </div>
          <span className={styles.sliderValue}>{llm.topP.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={1} step={0.05} value={llm.topP}
          onChange={(v) => patch({ topP: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>{t('behavior:llm.frequencyPenalty.label')}</label>
            <div className={styles.labelHint}>{t('behavior:llm.frequencyPenalty.hint')}</div>
          </div>
          <span className={styles.sliderValue}>{llm.frequencyPenalty.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={2} step={0.05} value={llm.frequencyPenalty}
          onChange={(v) => patch({ frequencyPenalty: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <div className={styles.sliderLabelBlock}>
            <label className={styles.label}>{t('behavior:llm.presencePenalty.label')}</label>
            <div className={styles.labelHint}>{t('behavior:llm.presencePenalty.hint')}</div>
          </div>
          <span className={styles.sliderValue}>{llm.presencePenalty.toFixed(2)}</span>
        </div>
        <SliderWithTicks min={0} max={2} step={0.05} value={llm.presencePenalty}
          onChange={(v) => patch({ presencePenalty: v })} formatValue={(v) => v.toFixed(1)} tickCount={5} />
      </div>
    </div>
  )
}

// ── Provider card definitions ─────────────────────────────────────────────────

interface LlmProviderDef {
  id: string
  name: string
  description: string
  icon: string
}

// ── Main component ────────────────────────────────────────────────────────────

interface BrainTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const BrainTab = ({ character, onUpdate }: BrainTabProps) => {
  const { t } = useTranslation(['brain'])
  const navigate = useNavigate()
  const { providerId } = useParams<{ providerId?: string }>()
  const [search, setSearch] = useState('')

  const providerDescriptions: Record<string, string> = {
    ollama:    t('brain:providers.ollama'),
    anthropic: t('brain:providers.anthropic'),
    deepseek:  t('brain:providers.deepseek'),
  }

  const PROVIDERS = useMemo((): LlmProviderDef[] =>
    PROVIDER_DEFS.map((p) => ({
      id:          p.id,
      name:        p.name,
      icon:        p.icon,
      description: providerDescriptions[p.id] ?? p.description,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [t])

  if (providerId) {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    return (
      <div className={styles.tabRoot}>
        <div className={styles.providerPageHeader}>
          <button
            type="button"
            className={styles.providerBackBtn}
            onClick={() => navigate('/profile/settings/brain')}
            aria-label="Back"
          >
            ←
          </button>
          <span className={styles.providerPageTitle}>
            {provider?.icon} {provider?.name ?? providerId} {t('brain:settings')}
          </span>
        </div>

        <div className={styles.section} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div className={styles.infoCard}>
            {providerId === 'ollama'
              ? <OllamaPanel character={character} onUpdate={onUpdate} />
              : <RemoteProviderPanel providerId={providerId} character={character} onUpdate={onUpdate} />
            }
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>{t('brain:llmParams')}</div>
          <div className={styles.infoCard}>
            <LlmParametersPanel character={character} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    )
  }

  const filtered = PROVIDERS.filter(
    (p) => !search.trim() ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className={styles.tabRoot}>
      <div className={styles.pgHeaderCard}>
        <div className={styles.pgHeaderTitle}>{t('brain:grid.title')}</div>
        <div className={styles.pgHeaderDesc}>{t('brain:grid.desc')}</div>
      </div>

      <div className={styles.providerSearchWrap}>
        <svg className={styles.providerSearchIcon} width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.providerSearchInput}
          type="text"
          placeholder={t('brain:grid.search')}
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
                <button
                  type="button"
                  className={styles.pgConfigure}
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate({ llm: { ...character.llm, providerId: provider.id } })
                    navigate(provider.id)
                  }}
                >
                  {t('brain:grid.configure')}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BrainTab
