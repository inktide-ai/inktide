import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PROVIDER_DEFS } from '../../../constants/providerDefs'
import {
  getCredentials,
  upsertCredential,
  deleteCredential,
  type CredentialResponse,
} from '../../../api/soul'
import styles from '../../../components/ProfilePage/ProfilePage.module.css'

// ── Network validation (manual test, full ping) ───────────────────────────────

async function pingOllama(baseUrl: string): Promise<string | null> {
  try {
    const url = baseUrl.replace(/\/v1\/?$/, '')
    const res = await fetch(`${url}/api/tags`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) return null
    return `Server returned ${res.status}`
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const isCors = msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('cors')
    if (isCors) {
      return [
        'Failed to reach Ollama. This is likely a CORS issue.',
        'Launch Ollama with:',
        '  OLLAMA_ORIGINS=* ollama serve',
      ].join('\n')
    }
    return `Cannot reach ${baseUrl}. Check the URL and that Ollama is running.`
  }
}

async function pingRemote(baseUrl: string, apiKey: string): Promise<string | null> {
  if (!apiKey.trim()) return 'API key is required.'
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok || res.status === 401) return null
    return `Server returned ${res.status}`
  } catch {
    return `Cannot reach ${baseUrl}. Check the URL and your network.`
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

type AutoState  = 'idle' | 'ok' | 'failed'
type ManualState = 'idle' | 'testing' | 'ok' | 'failed'

export default function ProviderDetailPage() {
  const { t } = useTranslation(['providers'])
  const navigate = useNavigate()
  const { providerId } = useParams<{ providerId: string }>()

  const def = PROVIDER_DEFS.find((p) => p.id === providerId)

  const [credential, setCredential] = useState<CredentialResponse | null>(null)
  const [apiKey, setApiKey]         = useState('')
  const [baseUrl, setBaseUrl]       = useState('')
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)
  const [saveOk, setSaveOk]         = useState(false)

  // Provider-specific extra config fields
  const [extraConfig, setExtraConfig] = useState<Record<string, unknown>>({})
  // KV-pairs state: { [fieldKey]: Array<[k, v]> }
  const [kvPairs, setKvPairs] = useState<Record<string, [string, string][]>>({})

  // Auto-validation (format check, no network)
  const [autoState, setAutoState]   = useState<AutoState>('idle')
  const [autoError, setAutoError]   = useState<string | null>(null)

  // Manual test (real network ping)
  const [manualState, setManualState]   = useState<ManualState>('idle')
  const [manualError, setManualError]   = useState<string | null>(null)
  const [bypassed, setBypassed]         = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load existing credential
  useEffect(() => {
    if (!providerId) return
    getCredentials()
      .then((list) => {
        const found = list.find((c) => c.providerId === providerId) ?? null
        setCredential(found)

        if (found?.baseUrl) setBaseUrl(found.baseUrl)
        else if (def?.defaultBaseUrl) setBaseUrl(def.defaultBaseUrl)
        else if (def?.fixedBaseUrl)   setBaseUrl(def.fixedBaseUrl)

        // Restore extra config
        if (found?.config) {
          try {
            const parsed = JSON.parse(found.config) as Record<string, unknown>
            // Split kv-pairs fields out into kvPairs state
            const newExtra: Record<string, unknown> = {}
            const newKv: Record<string, [string, string][]> = {}
            def?.extraFields?.forEach((f) => {
              if (f.type === 'kv-pairs') {
                const val = parsed[f.key]
                if (val && typeof val === 'object' && !Array.isArray(val)) {
                  newKv[f.key] = Object.entries(val as Record<string, string>)
                }
              } else {
                if (parsed[f.key] !== undefined) newExtra[f.key] = parsed[f.key]
              }
            })
            setExtraConfig(newExtra)
            setKvPairs(newKv)
          } catch {}
        } else {
          // Apply defaults from def
          const defaults: Record<string, unknown> = {}
          def?.extraFields?.forEach((f) => {
            if (f.type !== 'kv-pairs' && f.default !== undefined) defaults[f.key] = f.default
          })
          setExtraConfig(defaults)
        }
      })
      .catch(() => {})
  }, [providerId, def])

  // Auto-validation on input change (debounced, no network)
  const triggerAutoValidation = (key: string, url: string) => {
    setBypassed(false)
    setManualState('idle')
    setManualError(null)
    setAutoState('idle')
    setAutoError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!def) return

    const effectiveUrl = url || def.defaultBaseUrl || def.fixedBaseUrl || ''

    debounceRef.current = setTimeout(() => {
      const err = def.autoValidate({ apiKey: key, baseUrl: effectiveUrl })
      setAutoState(err ? 'failed' : 'ok')
      setAutoError(err)
    }, 300)
  }

  const handleApiKeyChange = (v: string) => {
    setApiKey(v)
    setSaveError(null)
    setSaveOk(false)
    triggerAutoValidation(v, baseUrl)
  }

  const handleBaseUrlChange = (v: string) => {
    setBaseUrl(v)
    setSaveError(null)
    setSaveOk(false)
    triggerAutoValidation(apiKey, v)
  }

  // Manual test — real network ping
  const handleTest = async () => {
    if (!def) return
    setManualState('testing')
    setManualError(null)
    setBypassed(false)

    const url = (baseUrl || def.defaultBaseUrl || def.fixedBaseUrl || '').trim()
    const key = apiKey.trim()

    const err = def.requiresKey
      ? await pingRemote(def.fixedBaseUrl ?? url, key)
      : await pingOllama(url)

    setManualState(err ? 'failed' : 'ok')
    setManualError(err)
  }

  const handleSave = async () => {
    if (!def || !providerId) return
    setSaveError(null)
    setSaveOk(false)
    setSaving(true)

    // Build config object from extraConfig + kvPairs
    const configObj: Record<string, unknown> = { ...extraConfig }
    def.extraFields?.forEach((f) => {
      if (f.type === 'kv-pairs') {
        const pairs = kvPairs[f.key] ?? []
        if (pairs.length > 0) {
          configObj[f.key] = Object.fromEntries(pairs.filter(([k]) => k.trim()))
        }
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
      setApiKey('')
      setSaveOk(true)
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
    setSaveError(null)
    setSaveOk(false)
    setDeleting(true)
    try {
      await deleteCredential(providerId)
      setCredential(null)
      setApiKey('')
      setBaseUrl(def?.defaultBaseUrl ?? def?.fixedBaseUrl ?? '')
      setAutoState('idle')
      setManualState('idle')
      setManualError(null)
      setBypassed(false)
    } catch {
      setSaveError(t('providers:detail.errors.deleteFailed'))
    } finally {
      setDeleting(false)
    }
  }

  if (!def) {
    return (
      <div className={styles.tabRoot}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚠</div>
          <div className={styles.emptyTitle}>{t('providers:detail.unknownProvider')}</div>
        </div>
      </div>
    )
  }

  const canSave = !saving && (
    autoState === 'idle' ||
    autoState === 'ok' ||
    (autoState === 'failed' && bypassed)
  )

  return (
    <div className={styles.tabRoot}>
      <div className={styles.providerPageHeader}>
        <button
          type="button"
          className={styles.providerBackBtn}
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          ←
        </button>
        <span className={styles.providerPageTitle}>
          {def.icon} {def.name}
        </span>
      </div>

      <div className={styles.section} style={{ borderTop: 'none', paddingTop: 0, marginTop: 0 }}>
        <div className={styles.infoCard}>
          <div className={styles.infoCardContent}>

            {/* Connection status */}
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('providers:detail.status')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className={credential ? styles.statusDotActive : styles.statusDotInactive} />
                <span className={styles.pgStatusLabel}>
                  {credential
                    ? t('providers:status.connected')
                    : t('providers:status.notConnected')}
                </span>
              </div>
            </div>

            {/* API key — remote providers only */}
            {def.requiresKey && (
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('providers:detail.apiKey.label')}</label>
                <div className={styles.labelHint}>
                  {credential?.hasKey
                    ? t('providers:detail.apiKey.replaceHint')
                    : t('providers:detail.apiKey.hint')}
                </div>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="sk-…"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                />
              </div>
            )}

            {/* Base URL — local providers (Ollama) */}
            {!def.requiresKey && (
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('providers:detail.baseUrl.label')}</label>
                <div className={styles.labelHint}>{t('providers:detail.baseUrl.hint')}</div>
                <input
                  className={styles.input}
                  type="text"
                  placeholder={def.defaultBaseUrl ?? 'http://localhost:11434/v1'}
                  value={baseUrl}
                  onChange={(e) => handleBaseUrlChange(e.target.value)}
                />
              </div>
            )}

            {/* Extra provider-specific fields */}
            {def.extraFields?.map((field) => {
              if (field.type === 'select') {
                return (
                  <div key={field.key} className={styles.formGroup}>
                    <label className={styles.label}>{field.label}</label>
                    {field.hint && <div className={styles.labelHint}>{field.hint}</div>}
                    <select
                      className={styles.input}
                      value={String(extraConfig[field.key] ?? field.default ?? '')}
                      onChange={(e) => setExtraConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )
              }

              if (field.type === 'kv-pairs') {
                const pairs = kvPairs[field.key] ?? []
                return (
                  <div key={field.key} className={styles.formGroup}>
                    <label className={styles.label}>{field.label}</label>
                    {field.hint && <div className={styles.labelHint}>{field.hint}</div>}
                    {pairs.map(([k, v], i) => (
                      <div key={i} className={styles.kvRow}>
                        <input
                          className={styles.input}
                          type="text"
                          placeholder="Header name"
                          value={k}
                          onChange={(e) => {
                            const next = pairs.map((p, j) => j === i ? [e.target.value, p[1]] as [string, string] : p)
                            setKvPairs((prev) => ({ ...prev, [field.key]: next }))
                          }}
                        />
                        <input
                          className={styles.input}
                          type="text"
                          placeholder="Value"
                          value={v}
                          onChange={(e) => {
                            const next = pairs.map((p, j) => j === i ? [p[0], e.target.value] as [string, string] : p)
                            setKvPairs((prev) => ({ ...prev, [field.key]: next }))
                          }}
                        />
                        <button
                          type="button"
                          className={styles.kvRemoveBtn}
                          onClick={() => setKvPairs((prev) => ({ ...prev, [field.key]: pairs.filter((_, j) => j !== i) }))}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={styles.kvAddBtn}
                      onClick={() => setKvPairs((prev) => ({ ...prev, [field.key]: [...pairs, ['', '']] }))}
                    >
                      + {t('providers:detail.addHeader')}
                    </button>
                  </div>
                )
              }

              return (
                <div key={field.key} className={styles.formGroup}>
                  <label className={styles.label}>{field.label}</label>
                  {field.hint && <div className={styles.labelHint}>{field.hint}</div>}
                  <input
                    className={styles.input}
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={String(extraConfig[field.key] ?? '')}
                    onChange={(e) => setExtraConfig((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              )
            })}

            {/* Auto-validation banner */}
            {autoState === 'ok' && (
              <div className={styles.validationBanner} data-state="ok">
                ✓ {t('providers:validation.autoOk')}
              </div>
            )}
            {autoState === 'failed' && !bypassed && (
              <div className={styles.validationBanner} data-state="failed">
                <div className={styles.validationTitle}>{autoError}</div>
              </div>
            )}

            {/* Manual test button + banner */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
              <button
                type="button"
                className={styles.btnTest}
                disabled={manualState === 'testing' || autoState === 'failed'}
                onClick={handleTest}
              >
                {manualState === 'testing'
                  ? t('providers:validation.checking')
                  : t('providers:validation.testConnection')}
              </button>
            </div>

            {manualState === 'ok' && (
              <div className={styles.validationBanner} data-state="ok">
                ✓ {t('providers:validation.ok')}
              </div>
            )}
            {manualState === 'failed' && !bypassed && (
              <div className={styles.validationBanner} data-state="failed">
                <div className={styles.validationTitle}>{t('providers:validation.failed')}</div>
                {manualError && <pre className={styles.validationMsg}>{manualError}</pre>}
                <button
                  type="button"
                  className={styles.btnContinueAnyway}
                  onClick={() => setBypassed(true)}
                >
                  {t('providers:validation.continueAnyway')}
                </button>
              </div>
            )}

            {/* Save feedback */}
            {saveError && <div className={styles.saveBarTextError}>{saveError}</div>}
            {saveOk    && <div className={styles.saveBarTextSuccess}>{t('providers:detail.savedOk')}</div>}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                className={styles.btnSave}
                disabled={!canSave}
                onClick={handleSave}
              >
                {saving ? t('providers:detail.saving') : t('providers:detail.save')}
              </button>

              {credential && (
                <button
                  type="button"
                  className={styles.btnDiscard}
                  disabled={deleting}
                  onClick={handleDelete}
                >
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
