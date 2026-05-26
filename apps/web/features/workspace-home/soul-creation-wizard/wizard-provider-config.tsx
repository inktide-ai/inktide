'use client'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { PROVIDER_DEFS } from '@/lib/providers'
import { VOICE_PROVIDER_CATALOG } from '@/shared/data/voice-providers'
import { upsertCredential, testCredential } from '@/entities/soul/api'
import { CredentialStatusBadge, type CredentialStatus } from '@/features/soul/components/credential-status-badge'
import { DynamicField } from './dynamic-field'
import type { WizardProviderItem } from './wizard-provider-card'

const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
  'home-ui-font text-[14px] text-[var(--text-primary)] outline-none',
  'placeholder:text-[var(--text-tertiary)] transition-colors',
  'focus:border-[var(--accent-base)]/50 focus:bg-[var(--surface-2)]',
)

const labelCls = 'home-ui-font mb-1.5 block text-[12px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]'

export interface WizardProviderConfigProps {
  panelType: 'llm' | 'tts'
  item: WizardProviderItem
  config: Record<string, string>
  onChange: (key: string, value: string) => void
  onConfirm: () => void
}

export function WizardProviderConfig({ panelType, item, config, onChange, onConfirm }: WizardProviderConfigProps) {
  const llmDef = panelType === 'llm' ? PROVIDER_DEFS.find(d => d.id === item.id) : null
  const ttsDef = panelType === 'tts' ? VOICE_PROVIDER_CATALOG.find(e => e.id === item.id) : null

  const needsApiKey = llmDef?.requiresKey || ttsDef?.requiresApiKey
  const fixedEndpoint = llmDef?.fixedBaseUrl
  const editableEndpoint = llmDef?.defaultBaseUrl
  const extraFields = llmDef?.extraFields ?? []
  const description = llmDef?.description ?? ttsDef?.description ?? ''

  const hasFields = needsApiKey || editableEndpoint || extraFields.length > 0

  const [testStatus, setTestStatus] = useState<CredentialStatus>('untested')
  const [testError, setTestError] = useState<string | null>(null)
  const [hasTested, setHasTested] = useState(false)

  useEffect(() => {
    setTestStatus('untested')
    setTestError(null)
    setHasTested(false)
  }, [config.apiKey])

  const handleClick = async () => {
    if (needsApiKey && config.apiKey && !hasTested) {
      setTestStatus('testing')
      try {
        await upsertCredential(item.id, config.apiKey, config.baseUrl ?? undefined)
        const result = await testCredential(item.id)
        setTestStatus(result.success ? 'verified' : 'failed')
        setTestError(result.error)
      } catch {
        setTestStatus('failed')
        setTestError('Could not reach validation service')
      }
      setHasTested(true)
      return
    }
    onConfirm()
  }

  const isTesting = testStatus === 'testing'
  const buttonLabel = isTesting
    ? 'Testing…'
    : hasTested && testStatus === 'verified'
      ? 'Continue ✓'
      : hasTested && testStatus === 'failed'
        ? 'Continue anyway'
        : `Select ${item.name}`

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px]',
            item.darkIcon && 'bg-white p-1.5',
          )}>
            <img
              src={item.iconSrc}
              alt={item.name}
              className={cn('object-contain', item.darkIcon ? 'h-full w-full' : 'h-10 w-10 rounded-[10px]')}
              draggable={false}
            />
          </div>
          <div className="min-w-0">
            <p className="home-ui-font truncate text-[14px] font-semibold text-[var(--text-primary)]">{item.name}</p>
            {item.subtitle && (
              <p className="home-ui-font truncate text-[11.5px] text-[var(--text-tertiary)]">{item.subtitle}</p>
            )}
          </div>
        </div>
        {description && (
          <p className="home-ui-font mt-2.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
        {!hasFields && panelType === 'tts' && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 px-4 py-3">
            <p className="home-ui-font text-[14px] leading-relaxed text-[var(--text-secondary)]">
              No API key required. {item.name} runs locally on your machine.
            </p>
            <p className="home-ui-font mt-1 text-[12px] text-[var(--text-tertiary)]">
              Full voice configuration is available in soul settings.
            </p>
          </div>
        )}

        {fixedEndpoint && (
          <div className="mb-4">
            <span className={labelCls}>Endpoint</span>
            <div className="flex h-9 items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 px-3">
              <span className="home-ui-font text-[12.5px] text-[var(--text-tertiary)]">{fixedEndpoint}</span>
            </div>
          </div>
        )}

        {needsApiKey && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className={labelCls.replace('mb-1.5 ', '')}>API Key</span>
              {testStatus !== 'untested' && (
                <CredentialStatusBadge status={testStatus} error={testError} />
              )}
            </div>
            <input
              type="password"
              value={config.apiKey ?? ''}
              onChange={e => onChange('apiKey', e.target.value)}
              placeholder={panelType === 'llm' ? 'sk-...' : 'API key'}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        )}

        {editableEndpoint && (
          <div className="mb-4">
            <span className={labelCls}>Server URL</span>
            <input
              type="text"
              value={config.baseUrl ?? editableEndpoint}
              onChange={e => onChange('baseUrl', e.target.value)}
              placeholder={editableEndpoint}
              className={inputCls}
              autoComplete="off"
            />
          </div>
        )}

        {extraFields.map(field => (
          <div key={field.key} className="mb-4">
            <span className={labelCls}>{field.label}</span>
            {field.hint && (
              <p className="home-ui-font mb-1.5 text-[12px] text-[var(--text-tertiary)]">{field.hint}</p>
            )}
            <DynamicField
              field={field}
              value={config[field.key] ?? String(field.default ?? '')}
              onChange={v => onChange(field.key, v)}
            />
          </div>
        ))}

        {panelType === 'tts' && hasFields && (
          <p className="home-ui-font mt-1 text-[12px] text-[var(--text-tertiary)]">
            Voice selection and advanced settings are available after creating your soul.
          </p>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] px-5 py-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={isTesting}
          className="home-ui-font flex h-9 w-full items-center justify-center rounded-xl text-[14px] font-semibold text-white transition-colors hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent-base)' }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
