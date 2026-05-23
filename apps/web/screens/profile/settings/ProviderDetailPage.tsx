'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { PROVIDER_DEFS } from '@/lib/providers'
import { pingOllama, pingRemote } from '@/lib/provider-validation'
import {
  getCredentials,
  upsertCredential,
  deleteCredential,
  type CredentialResponse,
} from '../../../api/soul'

// ── Shared class strings ──────────────────────────────────────────────────────

const sectionCls = 'flex flex-col gap-3 border-t border-(--border) pt-4 mt-6 [&:first-child]:border-t-0 [&:first-child]:pt-0 [&:first-child]:mt-0'
const infoContent = 'py-2'
const formGroup = 'mb-7'
const labelCls = 'block text-[0.875rem] font-semibold font-[var(--font-ui)] text-(--text-primary) mb-2'
const labelHint = 'text-[0.75rem] text-(--text-muted) mt-0.5 leading-[1.4]'
const inputCls = 'w-full py-[0.625rem] px-[0.875rem] bg-[#1e1f22] border border-[#2d2f33] rounded-[6px] text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] outline-none transition-[border-color,background] duration-[120ms] ease focus:border-white/20 focus:bg-[#26282e] placeholder:text-[rgba(139,144,154,0.45)] mt-2'
const validationOk = 'py-3 px-4 rounded-[8px] text-[0.8125rem] mb-3 bg-[rgba(34,197,94,0.1)] text-[#22c55e]'
const validationFailed = 'py-3 px-4 rounded-[8px] text-[0.8125rem] mb-3 flex flex-col gap-[0.4rem] bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-(--text-primary)'
const btnTest = 'py-[0.4rem] px-[0.85rem] rounded-[6px] text-[0.8rem] font-medium cursor-pointer bg-[rgba(99,102,241,0.12)] text-[#818cf8] border border-[rgba(99,102,241,0.25)] transition-[background] duration-150 whitespace-nowrap hover:enabled:bg-[rgba(99,102,241,0.22)] disabled:opacity-45 disabled:cursor-default'
const btnContinueAnyway = 'self-start mt-1 py-[0.35rem] px-3 rounded-[6px] text-[0.75rem] font-medium cursor-pointer bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)] transition-[background] duration-150 hover:bg-[rgba(239,68,68,0.25)]'
const kvRow = 'flex gap-2 items-center mb-[0.375rem]'
const kvRemoveBtn = 'shrink-0 py-[0.3rem] px-[0.55rem] rounded-[5px] text-[0.75rem] cursor-pointer bg-transparent text-(--text-muted) border border-(--border) transition-[background,color] duration-150 hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444] hover:border-[rgba(239,68,68,0.3)]'
const kvAddBtn = 'mt-1 py-[0.3rem] px-[0.65rem] rounded-[6px] text-[0.75rem] font-medium cursor-pointer bg-transparent text-(--text-muted) border border-dashed border-(--border) transition-[background,color] duration-150 hover:bg-white/[0.05] hover:text-white/60'
const btnSave = 'py-2 px-6 bg-(--accent-red) text-white border-none rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-[background,opacity] duration-200 ease flex items-center gap-2 hover:bg-(--accent-red-bright) disabled:opacity-60 disabled:cursor-not-allowed'
const btnDiscard = 'py-2 px-5 bg-transparent text-(--text-muted) border border-(--border) rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease hover:border-white/12 hover:text-(--text-primary)'

// ── Component ─────────────────────────────────────────────────────────────────

type AutoState   = 'idle' | 'ok' | 'failed'
type ManualState = 'idle' | 'testing' | 'ok' | 'failed'

export default function ProviderDetailPage() {
  const { t } = useTranslation(['providers'])
  const router = useRouter()
  const { providerId } = useParams<{ providerId: string }>()

  const def = PROVIDER_DEFS.find((p) => p.id === providerId)

  const [credential, setCredential] = useState<CredentialResponse | null>(null)
  const [apiKey, setApiKey]         = useState('')
  const [baseUrl, setBaseUrl]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [saveOk, setSaveOk]         = useState(false)
  const [extraConfig, setExtraConfig] = useState<Record<string, unknown>>({})
  const [kvPairs, setKvPairs] = useState<Record<string, [string, string][]>>({})
  const [autoState, setAutoState]   = useState<AutoState>('idle')
  const [autoError, setAutoError]   = useState<string | null>(null)
  const [manualState, setManualState]   = useState<ManualState>('idle')
  const [manualError, setManualError]   = useState<string | null>(null)
  const [bypassed, setBypassed]         = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!providerId) return
    getCredentials()
      .then((list) => {
        const found = list.find((c) => c.providerId === providerId) ?? null
        setCredential(found)
        if (found?.baseUrl) setBaseUrl(found.baseUrl)
        else if (def?.defaultBaseUrl) setBaseUrl(def.defaultBaseUrl)
        else if (def?.fixedBaseUrl)   setBaseUrl(def.fixedBaseUrl)
        if (found?.config) {
          try {
            const parsed = JSON.parse(found.config) as Record<string, unknown>
            const newExtra: Record<string, unknown> = {}
            const newKv: Record<string, [string, string][]> = {}
            def?.extraFields?.forEach((f) => {
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
          def?.extraFields?.forEach((f) => {
            if (f.type !== 'kv-pairs' && f.default !== undefined) defaults[f.key] = f.default
          })
          setExtraConfig(defaults)
        }
      })
      .catch(() => {})
  }, [providerId, def])

  const triggerAutoValidation = (key: string, url: string) => {
    setBypassed(false); setManualState('idle'); setManualError(null); setAutoState('idle'); setAutoError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!def) return
    const effectiveUrl = url || def.defaultBaseUrl || def.fixedBaseUrl || ''
    debounceRef.current = setTimeout(() => {
      const err = def.autoValidate({ apiKey: key, baseUrl: effectiveUrl })
      setAutoState(err ? 'failed' : 'ok')
      setAutoError(err)
    }, 300)
  }

  const handleApiKeyChange = (v: string) => { setApiKey(v); setSaveError(null); setSaveOk(false); triggerAutoValidation(v, baseUrl) }
  const handleBaseUrlChange = (v: string) => { setBaseUrl(v); setSaveError(null); setSaveOk(false); triggerAutoValidation(apiKey, v) }

  const handleTest = async () => {
    if (!def) return
    setManualState('testing'); setManualError(null); setBypassed(false)
    const url = (baseUrl || def.defaultBaseUrl || def.fixedBaseUrl || '').trim()
    const key = apiKey.trim()
    const err = def.requiresKey ? await pingRemote(def.fixedBaseUrl ?? url, key) : await pingOllama(url)
    setManualState(err ? 'failed' : 'ok'); setManualError(err)
  }

  const handleSave = async () => {
    if (!def || !providerId) return
    setSaveError(null); setSaveOk(false); setSaving(true)
    const configObj: Record<string, unknown> = { ...extraConfig }
    def.extraFields?.forEach((f) => {
      if (f.type === 'kv-pairs') {
        const pairs = kvPairs[f.key] ?? []
        if (pairs.length > 0) configObj[f.key] = Object.fromEntries(pairs.filter(([k]) => k.trim()))
      }
    })
    const hasConfig = Object.keys(configObj).length > 0
    try {
      await upsertCredential(
        providerId,
        def.requiresKey ? (apiKey.trim() || null) : null,
        baseUrl.trim() || def.defaultBaseUrl || null,
        hasConfig ? configObj : null,
      )
      setApiKey(''); setSaveOk(true)
      const list = await getCredentials()
      setCredential(list.find((c) => c.providerId === providerId) ?? null)
    } catch {
      setSaveError(t('providers:detail.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!providerId) return
    setSaveError(null); setSaveOk(false); setDeleting(true)
    try {
      await deleteCredential(providerId)
      setCredential(null); setApiKey(''); setBaseUrl(def?.defaultBaseUrl ?? def?.fixedBaseUrl ?? '')
      setAutoState('idle'); setManualState('idle'); setManualError(null); setBypassed(false)
    } catch {
      setSaveError(t('providers:detail.errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  if (!def) {
    return (
      <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
        <div className="text-center py-16 px-8 text-(--text-muted)">
          <div className="text-[3rem] mb-4 opacity-40">⚠</div>
          <div className="text-[1.125rem] font-bold text-(--text-primary) mb-2">{t('providers:detail.unknownProvider')}</div>
        </div>
      </div>
    )
  }

  const canSave = !saving && (autoState === 'idle' || autoState === 'ok' || (autoState === 'failed' && bypassed))

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7 pb-4 border-b border-white/[0.06]">
        <button type="button" className="flex items-center justify-center w-7 h-7 bg-white/[0.04] border border-[#2d2f33] rounded-[6px] text-white/45 cursor-pointer transition-all duration-[120ms] ease shrink-0 hover:border-[#42454d] hover:text-white/85 hover:bg-white/[0.07]" onClick={() => router.back()} aria-label="Back">←</button>
        <span className="text-[1rem] font-semibold text-(--text-primary) tracking-[-0.01em]">{def.icon} {def.name}</span>
      </div>

      <div className={sectionCls} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
        <div>
          <div className={infoContent}>
            {/* Status */}
            <div className={formGroup}>
              <label className={labelCls}>{t('providers:detail.status')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className={credential ? 'w-2 h-2 rounded-full bg-[#22c55e] shrink-0' : 'w-2 h-2 rounded-full bg-[rgba(148,163,184,0.35)] shrink-0'} />
                <span className="text-[0.6875rem] font-medium text-(--text-muted) font-[var(--font-ui)]">
                  {credential ? t('providers:status.connected') : t('providers:status.notConnected')}
                </span>
              </div>
            </div>

            {/* API key */}
            {def.requiresKey && (
              <div className={formGroup}>
                <label className={labelCls}>{t('providers:detail.apiKey.label')}</label>
                <div className={labelHint}>{credential?.hasKey ? t('providers:detail.apiKey.replaceHint') : t('providers:detail.apiKey.hint')}</div>
                <input className={inputCls} type="password" placeholder="sk-…" value={apiKey} onChange={(e) => handleApiKeyChange(e.target.value)} />
              </div>
            )}

            {/* Base URL */}
            {!def.requiresKey && (
              <div className={formGroup}>
                <label className={labelCls}>{t('providers:detail.baseUrl.label')}</label>
                <div className={labelHint}>{t('providers:detail.baseUrl.hint')}</div>
                <input className={inputCls} type="text" placeholder={def.defaultBaseUrl ?? 'http://localhost:11434/v1'} value={baseUrl} onChange={(e) => handleBaseUrlChange(e.target.value)} />
              </div>
            )}

            {/* Extra fields */}
            {def.extraFields?.map((field) => {
              if (field.type === 'select') return (
                <div key={field.key} className={formGroup}>
                  <label className={labelCls}>{field.label}</label>
                  {field.hint && <div className={labelHint}>{field.hint}</div>}
                  <select className={`${inputCls} mt-2`} value={String(extraConfig[field.key] ?? field.default ?? '')} onChange={(e) => setExtraConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}>
                    {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              )
              if (field.type === 'kv-pairs') {
                const pairs = kvPairs[field.key] ?? []
                return (
                  <div key={field.key} className={formGroup}>
                    <label className={labelCls}>{field.label}</label>
                    {field.hint && <div className={labelHint}>{field.hint}</div>}
                    {pairs.map(([k, v], i) => (
                      <div key={i} className={kvRow}>
                        <input className={`${inputCls} flex-1 min-w-0 mt-0`} type="text" placeholder="Header name" value={k} onChange={(e) => { const next = pairs.map((p, j) => j === i ? [e.target.value, p[1]] as [string, string] : p); setKvPairs((prev) => ({ ...prev, [field.key]: next })) }} />
                        <input className={`${inputCls} flex-1 min-w-0 mt-0`} type="text" placeholder="Value" value={v} onChange={(e) => { const next = pairs.map((p, j) => j === i ? [p[0], e.target.value] as [string, string] : p); setKvPairs((prev) => ({ ...prev, [field.key]: next })) }} />
                        <button type="button" className={kvRemoveBtn} onClick={() => setKvPairs((prev) => ({ ...prev, [field.key]: pairs.filter((_, j) => j !== i) }))}>✕</button>
                      </div>
                    ))}
                    <button type="button" className={kvAddBtn} onClick={() => setKvPairs((prev) => ({ ...prev, [field.key]: [...pairs, ['', '']] }))}>+ {t('providers:detail.addHeader')}</button>
                  </div>
                )
              }
              return (
                <div key={field.key} className={formGroup}>
                  <label className={labelCls}>{field.label}</label>
                  {field.hint && <div className={labelHint}>{field.hint}</div>}
                  <input className={inputCls} type={field.type === 'password' ? 'password' : 'text'} placeholder={field.placeholder} value={String(extraConfig[field.key] ?? '')} onChange={(e) => setExtraConfig((prev) => ({ ...prev, [field.key]: e.target.value }))} />
                </div>
              )
            })}

            {/* Auto-validation */}
            {autoState === 'ok' && <div className={validationOk}>✓ {t('providers:validation.autoOk')}</div>}
            {autoState === 'failed' && !bypassed && (
              <div className={validationFailed}><div className="font-semibold text-[#ef4444]">{autoError}</div></div>
            )}

            {/* Manual test */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <button type="button" className={btnTest} disabled={manualState === 'testing' || autoState === 'failed'} onClick={handleTest}>
                {manualState === 'testing' ? t('providers:validation.checking') : t('providers:validation.testConnection')}
              </button>
            </div>
            {manualState === 'ok' && <div className={`${validationOk} mt-3`}>✓ {t('providers:validation.ok')}</div>}
            {manualState === 'failed' && !bypassed && (
              <div className={`${validationFailed} mt-3`}>
                <div className="font-semibold text-[#ef4444]">{t('providers:validation.failed')}</div>
                {manualError && <pre className="font-[inherit] text-[0.75rem] text-(--text-muted) whitespace-pre-wrap break-words m-0 p-0">{manualError}</pre>}
                <button type="button" className={btnContinueAnyway} onClick={() => setBypassed(true)}>{t('providers:validation.continueAnyway')}</button>
              </div>
            )}

            {/* Save feedback */}
            {saveError && <div className="text-[0.8125rem] text-[#ef4444] mt-2">{saveError}</div>}
            {saveOk    && <div className="text-[0.8125rem] text-[#22c55e] mt-2">{t('providers:detail.savedOk')}</div>}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className={btnSave} disabled={!canSave} onClick={handleSave}>
                {saving ? t('providers:detail.saving') : t('providers:detail.save')}
              </button>
              {credential && (
                <button type="button" className={btnDiscard} disabled={deleting} onClick={handleDelete}>
                  {deleting ? t('providers:detail.deleting') : t('providers:detail.delete')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
