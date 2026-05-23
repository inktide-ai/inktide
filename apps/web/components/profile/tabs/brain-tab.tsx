'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import SliderWithTicks from '../slider-with-ticks'
import type { AiCharacter } from '@/lib/character'
import { getChatModels, type ChatModelInfo } from '../../../api/chat'
import {
  getCatalogLlmModels,
  getCredentials,
  upsertCredential,
  type LlmModelResponse,
  type CredentialResponse,
} from '../../../api/soul'
import { PROVIDER_DEFS } from '@/lib/providers'
import { pingOllama, pingRemote } from '@/lib/provider-validation'
import { useCharactersContext } from '../../../context/CharactersContext'

// ── Shared class strings ──────────────────────────────────────────────────────

const infoContent = 'py-2'
const formGroup = 'mb-7'
const label = 'block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2'
const labelHint = 'text-[0.75rem] text-(--text-muted) mt-0.5 leading-[1.4]'
const inputCls = 'w-full py-[0.625rem] px-[0.875rem] bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] outline-none transition-[border-color,background] duration-[120ms] ease focus:border-white/20 focus:bg-[#26282e] placeholder:text-[rgba(139,144,154,0.45)]'
const sliderHeader = 'flex justify-between items-start gap-4 mb-3'
const sliderValue = 'text-[0.6875rem] font-semibold font-mono text-(--accent-red-bright) bg-[linear-gradient(135deg,rgba(237,62,62,0.15),rgba(237,62,62,0.08))] py-0.5 px-[0.375rem] rounded-[0.25rem] border border-[rgba(237,62,62,0.2)] shrink-0'
const labelInBlock = 'block text-[0.9375rem] font-bold text-(--text-primary) mb-1'
const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const sectionTitle = 'text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2'
const voiceSelectWrap = 'relative flex items-center mt-2'
const voiceSelect = 'w-full appearance-none bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] py-[0.625rem] pr-11 pl-[0.875rem] text-(--text-primary) font-[var(--font-ui)] text-[0.875rem] cursor-pointer outline-none transition-[background,border-color] duration-[120ms] ease hover:bg-[#26282e] hover:border-[#42454d] focus:bg-[#26282e] focus:border-white/20 [&_option]:bg-[#1e1f22]'
const voiceSelectChevron = 'absolute right-4 text-white/30 pointer-events-none shrink-0'
const btnTest = 'py-[0.4rem] px-[0.85rem] rounded-[6px] text-[0.8rem] font-medium cursor-pointer bg-[rgba(99,102,241,0.12)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] transition-[background] duration-150 whitespace-nowrap hover:enabled:bg-[rgba(99,102,241,0.22)] disabled:opacity-45 disabled:cursor-default'
const validationOk = 'py-3 px-4 rounded-[8px] text-[0.8125rem] mb-3 bg-[rgba(34,197,94,0.1)] text-[#22c55e]'
const validationFailed = 'py-3 px-4 rounded-[8px] text-[0.8125rem] mb-3 flex flex-col gap-[0.4rem] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-(--text-primary)'
const btnContinueAnyway = 'self-start mt-1 py-[0.35rem] px-3 rounded-[6px] text-[0.75rem] font-medium cursor-pointer bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] transition-[background] duration-150 hover:bg-[rgba(239,68,68,0.25)]'
const kvRow = 'flex gap-2 items-center mb-[0.375rem]'
const kvRemoveBtn = 'shrink-0 py-[0.3rem] px-[0.55rem] rounded-[5px] text-[0.75rem] cursor-pointer bg-transparent text-(--text-muted) border border-(--border) transition-[background,color] duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)]'
const kvAddBtn = 'mt-1 py-[0.3rem] px-[0.65rem] rounded-[6px] text-[0.75rem] font-medium cursor-pointer bg-transparent text-(--text-muted) border border-dashed border-(--border) transition-[background,color] duration-150 hover:bg-white/[0.05] hover:text-white/60'


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

  const baseUrlRef   = useRef(baseUrl)
  const extraRef     = useRef(extraConfig)
  const kvRef        = useRef(kvPairs)
  baseUrlRef.current = baseUrl
  extraRef.current   = extraConfig
  kvRef.current      = kvPairs

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
    <div className={infoContent}>
      <div className={formGroup}>
        <label className={label}>{t('providers:detail.status')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span className={cred ? 'w-2 h-2 rounded-full bg-[#22c55e] shrink-0' : 'w-2 h-2 rounded-full bg-[rgba(148,163,184,0.35)] shrink-0'} />
          <span className="text-[0.6875rem] font-medium text-(--text-muted) font-[var(--font-ui)]">
            {cred ? t('providers:status.connected') : t('providers:status.notConnected')}
          </span>
        </div>
      </div>

      <div className={formGroup}>
        <label className={label}>{t('brain:baseUrl.label')}</label>
        <div className={labelHint}>{t('brain:baseUrl.hint')}</div>
        <input className={`${inputCls} mt-2`} type="text" placeholder={def.defaultBaseUrl} value={baseUrl} onChange={(e) => handleBaseUrlChange(e.target.value)} />
      </div>

      {autoState === 'ok' && <div className={validationOk}>✓ {t('providers:validation.autoOk')}</div>}
      {autoState === 'failed' && !bypassed && (
        <div className={validationFailed}>
          <div className="font-semibold text-[#ef4444]">{autoError}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button type="button" className={btnTest} disabled={manualState === 'testing' || autoState === 'failed'} onClick={handleTest}>
          {manualState === 'testing' ? t('providers:validation.checking') : t('providers:validation.testConnection')}
        </button>
      </div>
      {manualState === 'ok' && <div className={validationOk}>✓ {t('providers:validation.ok')}</div>}
      {manualState === 'failed' && !bypassed && (
        <div className={validationFailed}>
          <div className="font-semibold text-[#ef4444]">{t('providers:validation.failed')}</div>
          {manualError && <pre className="font-[inherit] text-[0.75rem] text-(--text-muted) whitespace-pre-wrap break-words m-0 p-0">{manualError}</pre>}
          <button type="button" className={btnContinueAnyway} onClick={() => setBypassed(true)}>
            {t('providers:validation.continueAnyway')}
          </button>
        </div>
      )}

      <div className={formGroup} style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <label className={label}>{t('brain:model.label')}</label>
        <div className={labelHint}>
          {modelsLoading ? t('brain:model.loading') : modelsError ? t('brain:model.error') : models.length === 0 ? t('brain:model.empty') : t('brain:model.hint')}
        </div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={llm.modelId ?? ''} disabled={modelsLoading || models.length === 0} onChange={(e) => patch({ modelId: e.target.value || null })}>
            <option value="">{t('brain:model.selectPlaceholder')}</option>
            {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <svg className={voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {def.extraFields?.filter((f) => f.type === 'kv-pairs').map((field) => {
        const pairs = kvPairs[field.key] ?? []
        return (
          <div key={field.key} className={formGroup}>
            <label className={label}>{field.label}</label>
            {field.hint && <div className={labelHint}>{field.hint}</div>}
            {pairs.map(([k, v], i) => (
              <div key={i} className={kvRow}>
                <input className={`${inputCls} flex-1 min-w-0`} type="text" placeholder="Header" value={k}
                  onChange={(e) => { const next = pairs.map((p, j): [string, string] => j === i ? [e.target.value, p[1]] : p); setKvPairs((prev) => ({ ...prev, [field.key]: next })); markCredentialDirty() }} />
                <input className={`${inputCls} flex-1 min-w-0`} type="text" placeholder="Value" value={v}
                  onChange={(e) => { const next = pairs.map((p, j): [string, string] => j === i ? [p[0], e.target.value] : p); setKvPairs((prev) => ({ ...prev, [field.key]: next })); markCredentialDirty() }} />
                <button type="button" className={kvRemoveBtn}
                  onClick={() => { setKvPairs((prev) => ({ ...prev, [field.key]: pairs.filter((_, j) => j !== i) })); markCredentialDirty() }}>✕</button>
              </div>
            ))}
            <button type="button" className={kvAddBtn}
              onClick={() => { setKvPairs((prev) => ({ ...prev, [field.key]: [...pairs, ['', '']] })); markCredentialDirty() }}>
              + {t('providers:detail.addHeader')}
            </button>
          </div>
        )
      })}

      {def.extraFields?.filter((f) => f.type === 'select').map((field) => (
        <div key={field.key} className={formGroup}>
          <label className={label}>{field.label}</label>
          {field.hint && <div className={labelHint}>{field.hint}</div>}
          <select className={`${inputCls} mt-2`} value={String(extraConfig[field.key] ?? field.default ?? '')} onChange={(e) => handleExtraChange(field.key, e.target.value)}>
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

  const apiKeyRef   = useRef(apiKey)
  apiKeyRef.current = apiKey

  useEffect(() => {
    const key = `${providerId}-credential`
    registerSavePlugin(key, async () => {
      const k = apiKeyRef.current.trim()
      if (!k) return
      await upsertCredential(providerId, k, def?.fixedBaseUrl ?? null)
      setApiKey('')
      const list = await getCredentials()
      setCred(list.find((c) => c.providerId === providerId) ?? null)
    })
    return () => unregisterSavePlugin(key)
  }, [providerId, def, registerSavePlugin, unregisterSavePlugin])

  useEffect(() => {
    getCredentials().then((list) => setCred(list.find((c) => c.providerId === providerId) ?? null)).catch(() => {})
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

  const handleApiKeyChange = (v: string) => { setApiKey(v); markCredentialDirty(); triggerAutoValidation(v) }

  const handleTest = async () => {
    if (!def?.fixedBaseUrl) return
    setManualState('testing'); setManualError(null); setBypassed(false)
    const err = await pingRemote(def.fixedBaseUrl, apiKey)
    setManualState(err ? 'failed' : 'ok'); setManualError(err)
  }

  return (
    <div className={infoContent}>
      <div className={formGroup}>
        <label className={label}>{t('providers:detail.status')}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <span className={cred?.hasKey ? 'w-2 h-2 rounded-full bg-[#22c55e] shrink-0' : 'w-2 h-2 rounded-full bg-[rgba(148,163,184,0.35)] shrink-0'} />
          <span className="text-[0.6875rem] font-medium text-(--text-muted) font-[var(--font-ui)]">
            {cred?.hasKey ? t('providers:status.connected') : t('providers:status.notConnected')}
          </span>
        </div>
      </div>

      <div className={formGroup}>
        <label className={label}>{t('providers:detail.apiKey.label')}</label>
        <div className={labelHint}>{cred?.hasKey ? t('providers:detail.apiKey.replaceHint') : t('providers:detail.apiKey.hint')}</div>
        <input className={`${inputCls} mt-2`} type="password" placeholder="sk-…" value={apiKey} onChange={(e) => handleApiKeyChange(e.target.value)} />
      </div>

      {autoState === 'ok' && <div className={validationOk}>✓ {t('providers:validation.autoOk')}</div>}
      {autoState === 'failed' && !bypassed && (
        <div className={validationFailed}>
          <div className="font-semibold text-[#ef4444]">{autoError}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button type="button" className={btnTest} disabled={manualState === 'testing' || !apiKey.trim()} onClick={handleTest}>
          {manualState === 'testing' ? t('providers:validation.checking') : t('providers:validation.testConnection')}
        </button>
      </div>

      {manualState === 'ok' && <div className={validationOk}>✓ {t('providers:validation.ok')}</div>}
      {manualState === 'failed' && !bypassed && (
        <div className={validationFailed}>
          <div className="font-semibold text-[#ef4444]">{t('providers:validation.failed')}</div>
          {manualError && <pre className="font-[inherit] text-[0.75rem] text-(--text-muted) whitespace-pre-wrap break-words m-0 p-0">{manualError}</pre>}
          <button type="button" className={btnContinueAnyway} onClick={() => setBypassed(true)}>
            {t('providers:validation.continueAnyway')}
          </button>
        </div>
      )}

      <div className={formGroup} style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <label className={label}>{t('brain:model.label')}</label>
        <div className={labelHint}>{modelsLoading ? t('brain:model.loading') : models.length === 0 ? t('brain:model.empty') : t('brain:model.hint')}</div>
        <div className={voiceSelectWrap}>
          <select className={voiceSelect} value={llm.modelId ?? ''} disabled={modelsLoading || models.length === 0} onChange={(e) => patch({ modelId: e.target.value || null })}>
            <option value="">{t('brain:model.selectPlaceholder')}</option>
            {models.map((m) => <option key={m.id} value={m.model_id}>{m.display_name}</option>)}
          </select>
          <svg className={voiceSelectChevron} width="12" height="12" viewBox="0 0 12 12" fill="none">
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

  const sliders = [
    { key: 'temperature',      label: t('behavior:llm.temperature.label'),     hint: t('behavior:llm.temperature.hint'),     val: llm.temperature,      disp: llm.temperature.toFixed(2),      min: 0,  max: 2,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ temperature: v }) },
    { key: 'maxTokens',        label: t('behavior:llm.maxTokens.label'),       hint: t('behavior:llm.maxTokens.hint'),       val: llm.maxTokens,        disp: String(llm.maxTokens),           min: 64, max: 4096, step: 64,   fmt: (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v)), tc: 5, cb: (v: number) => patch({ maxTokens: v }) },
    { key: 'topP',             label: t('behavior:llm.topP.label'),            hint: t('behavior:llm.topP.hint'),            val: llm.topP,             disp: llm.topP.toFixed(2),             min: 0,  max: 1,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ topP: v }) },
    { key: 'frequencyPenalty', label: t('behavior:llm.frequencyPenalty.label'), hint: t('behavior:llm.frequencyPenalty.hint'), val: llm.frequencyPenalty, disp: llm.frequencyPenalty.toFixed(2), min: 0,  max: 2,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ frequencyPenalty: v }) },
    { key: 'presencePenalty',  label: t('behavior:llm.presencePenalty.label'), hint: t('behavior:llm.presencePenalty.hint'), val: llm.presencePenalty, disp: llm.presencePenalty.toFixed(2),   min: 0,  max: 2,    step: 0.05, fmt: (v: number) => v.toFixed(1), tc: 5, cb: (v: number) => patch({ presencePenalty: v }) },
  ]

  return (
    <div className={infoContent}>
      {sliders.map(({ key, label: lbl, hint, val, disp, min, max, step, fmt, tc, cb }) => (
        <div key={key} className="mb-7">
          <div className={sliderHeader}>
            <div className="min-w-0 flex-1">
              <label className={labelInBlock}>{lbl}</label>
              <div className={labelHint}>{hint}</div>
            </div>
            <span className={sliderValue}>{disp}</span>
          </div>
          <SliderWithTicks min={min} max={max} step={step} value={val} onChange={cb} formatValue={fmt} tickCount={tc} />
        </div>
      ))}
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
  const router = useRouter()
  const { providerId } = useParams<{ providerId?: string }>()
  const [search, setSearch] = useState('')

  const providerDescriptions: Record<string, string> = {
    ollama:    t('brain:providers.ollama'),
    anthropic: t('brain:providers.anthropic'),
    deepseek:  t('brain:providers.deepseek'),
  }

  const PROVIDERS = useMemo((): LlmProviderDef[] =>
    PROVIDER_DEFS.map((p) => ({
      id: p.id, name: p.name, icon: p.icon,
      description: providerDescriptions[p.id] ?? p.description,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [t])

  if (providerId) {
    const provider = PROVIDERS.find((p) => p.id === providerId)
    return (
      <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
        <div className="flex items-center gap-3 mb-7 pb-4 border-b border-white/[0.06]">
          <button
            type="button"
            className="flex items-center justify-center w-7 h-7 bg-white/[0.04] border border-[#2d2f33] rounded-[6px] text-white/45 cursor-pointer transition-all duration-[120ms] ease shrink-0 hover:border-[#42454d] hover:text-white/85 hover:bg-white/[0.07]"
            onClick={() => router.push('/settings/brain')}
            aria-label="Back"
          >←</button>
          <span className="text-[1rem] font-semibold text-(--text-primary) tracking-[-0.01em]">
            {provider?.icon} {provider?.name ?? providerId} {t('brain:settings')}
          </span>
        </div>

        <div className={sectionCls} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
          <div>
            {providerId === 'ollama'
              ? <OllamaPanel character={character} onUpdate={onUpdate} />
              : <RemoteProviderPanel providerId={providerId} character={character} onUpdate={onUpdate} />
            }
          </div>
        </div>

        <div className={sectionCls}>
          <div className={sectionTitle}>{t('brain:llmParams')}</div>
          <div>
            <LlmParametersPanel character={character} onUpdate={onUpdate} />
          </div>
        </div>
      </div>
    )
  }

  const filtered = PROVIDERS.filter(
    (p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      <div className="mb-[0.875rem] pb-[0.875rem] border-b border-white/[0.06]">
        <div className="text-[0.625rem] font-bold text-white/38 tracking-[0.09em] uppercase mb-[0.3rem]">{t('brain:grid.title')}</div>
        <div className="text-[0.8125rem] text-white/50 leading-[1.55]">{t('brain:grid.desc')}</div>
      </div>

      <div className="relative flex items-center">
        <svg className="absolute left-4 text-[0.9375rem] text-white/20 pointer-events-none leading-none transition-[color] duration-150 ease [.providerSearchWrap:focus-within_&]:text-white/40" width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          className="w-full py-[0.6875rem] pr-4 pl-10 bg-white/[0.03] border border-white/[0.06] rounded-[0.625rem] text-(--text-primary) font-[var(--font-ui)] text-[0.875rem] outline-none transition-[background,border-color] duration-150 ease placeholder:text-white/20 focus:bg-white/[0.05] focus:border-white/10"
          type="text"
          placeholder={t('brain:grid.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-[0.375rem] mt-[0.875rem]">
        {filtered.map((provider) => {
          const isActive = character.llm.providerId === provider.id
          return (
            <div
              key={provider.id}
              className={cn(
                'relative bg-[#1e1f22] border border-[#2d2f33] border-l-2 border-l-transparent rounded-[8px] p-4 cursor-pointer transition-[background,border-color] duration-[120ms] ease flex flex-col min-h-[114px] overflow-hidden select-none outline-none hover:bg-[#26282e] hover:border-[#42454d] focus-visible:shadow-[0_0_0_2px_rgba(53,116,240,0.4)]',
                isActive && 'border-[#2a5040] border-l-[#22c55e] bg-[#162820] hover:bg-[#1a3025] hover:border-[#2a5040]',
              )}
              role="button"
              tabIndex={0}
              onClick={() => { if (!isActive) onUpdate({ llm: { ...character.llm, providerId: provider.id } }) }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isActive) onUpdate({ llm: { ...character.llm, providerId: provider.id } }) }}
            >
              <div className="absolute top-[0.875rem] right-[0.875rem] text-[2.25rem] opacity-10 leading-none pointer-events-none">{provider.icon}</div>
              <div className="text-[0.8125rem] font-semibold text-(--text-primary) leading-[1.3]">{provider.name}</div>
              <div className="text-[0.6875rem] text-white/38 leading-[1.45] mt-[0.2rem]">{provider.description}</div>
              <div className="flex items-center justify-between mt-auto pt-[0.625rem]">
                <div className={cn('w-[14px] h-[14px] rounded-full border-[1.5px] border-white/15 shrink-0 transition-all duration-150 ease flex items-center justify-center', isActive && 'border-[#22c55e] bg-[#22c55e]')} />
                <button
                  type="button"
                  className="inline-flex items-center gap-[0.2rem] text-[0.6875rem] font-medium text-white/35 bg-transparent border-none p-0 cursor-pointer font-[inherit] transition-[color] duration-[120ms] ease leading-none hover:text-white/70"
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdate({ llm: { ...character.llm, providerId: provider.id } })
                    router.push(`/settings/providers/${provider.id}`)
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
