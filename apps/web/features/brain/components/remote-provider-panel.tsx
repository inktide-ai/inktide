'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'
import type { LlmModelResponse } from '@/shared/types/soul-api'
import { getCatalogLlmModels, getCredentials, upsertCredential } from '@/entities/soul/api'
import { PROVIDER_DEFS } from '@/shared/data/providers'
import { pingRemote } from '@/features/brain/lib/provider-validation'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import {
  infoContent, formGroup, label, labelHint, inputCls,
  validationOk, validationFailed, btnContinueAnyway,
  voiceSelectWrap, voiceSelect, voiceSelectChevron, btnTest,
} from '../lib/panel-styles'

export interface PanelProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

type AutoState   = 'idle' | 'ok' | 'failed'
type ManualState = 'idle' | 'testing' | 'ok' | 'failed'

interface RemoteProviderPanelProps extends PanelProps {
  providerId: string
}

export function RemoteProviderPanel({ providerId, character, onUpdate }: RemoteProviderPanelProps) {
  const { t } = useTranslation(['brain', 'providers'])
  const { registerSavePlugin, unregisterSavePlugin, markCredentialDirty } = useCharactersContext()

  const llm   = character.llm
  const def   = PROVIDER_DEFS.find((p) => p.id === providerId)
  const patch = (p: Partial<typeof llm>) => onUpdate({ llm: { ...llm, ...p } })

  const [cred, setCred]   = useState<Awaited<ReturnType<typeof getCredentials>>[number] | null>(null)
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
          <span className={cred?.hasKey ? 'w-2 h-2 rounded-full bg-[var(--color-online)] shrink-0' : 'w-2 h-2 rounded-full bg-[rgba(148,163,184,0.35)] shrink-0'} />
          <span className="text-caption font-medium text-(--text-muted) font-[var(--font-ui)]">
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
          <div className="font-semibold text-[var(--color-error-strong)]">{autoError}</div>
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
          <div className="font-semibold text-[var(--color-error-strong)]">{t('providers:validation.failed')}</div>
          {manualError && <pre className="font-[inherit] text-xs text-(--text-muted) whitespace-pre-wrap break-words m-0 p-0">{manualError}</pre>}
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
