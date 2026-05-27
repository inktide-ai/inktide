'use client'

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'
import { PROVIDER_DEFS } from '@/lib/providers'
import { pingOllama } from '@/lib/provider-validation'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { useOllamaCredentials } from '../hooks/useOllamaCredentials'
import { useOllamaModels } from '../hooks/useOllamaModels'
import {
  infoContent, formGroup, label, labelHint, inputCls,
  validationOk, validationFailed, btnContinueAnyway,
  voiceSelectWrap, voiceSelect, voiceSelectChevron, btnTest,
  kvRow, kvRemoveBtn, kvAddBtn,
} from '../lib/panel-styles'

export interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

type AutoState   = 'idle' | 'ok' | 'failed'
type ManualState = 'idle' | 'testing' | 'ok' | 'failed'

export function OllamaPanel({ character, onUpdate }: PanelProps) {
  const { t } = useTranslation(['brain', 'providers'])
  const { registerSavePlugin, unregisterSavePlugin, markCredentialDirty } = useCharactersContext()

  const llm = character.llm
  const def = PROVIDER_DEFS.find((p) => p.id === 'ollama')!
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  const creds = useOllamaCredentials(def, registerSavePlugin, unregisterSavePlugin)
  const { cred, credLoading, baseUrl, setBaseUrl, extraConfig, setExtraConfig, kvPairs, setKvPairs } = creds

  const effectiveBaseUrl = baseUrl || def.defaultBaseUrl || 'http://localhost:11434'
  const { models, modelsLoading, modelsError } = useOllamaModels(effectiveBaseUrl, credLoading)

  const [autoState, setAutoState]     = useState<AutoState>('idle')
  const [autoError, setAutoError]     = useState<string | null>(null)
  const [manualState, setManualState] = useState<ManualState>('idle')
  const [manualError, setManualError] = useState<string | null>(null)
  const [bypassed, setBypassed]       = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
