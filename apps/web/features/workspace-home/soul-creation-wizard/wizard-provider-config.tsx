'use client'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { LLM_PROVIDER_CATALOG } from '@/shared/data/llm-provider-catalog'
import { VOICE_PROVIDER_CATALOG } from '@/shared/data/voice-providers'
import { CredentialStatusBadge } from '@/shared/ui/credential-status-badge'
import { useCredentialTest } from '@/shared/lib/hooks/useCredentialTest'
import { DynamicField } from './dynamic-field'
import type { WizardProviderItem } from './wizard-provider-card'

const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
  'home-ui-font text-body text-[var(--text-primary)] outline-none',
  'placeholder:text-[var(--text-tertiary)] transition-colors',
  'focus:border-[var(--accent-base)]/50 focus:bg-[var(--surface-2)]',
)

const labelCls = 'home-ui-font mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--text-tertiary)]'

export interface WizardProviderConfigProps {
  panelType: 'llm' | 'tts'
  item: WizardProviderItem
  config: Record<string, string>
  onChange: (key: string, value: string) => void
  onConfirm: () => void
}

export function WizardProviderConfig({ panelType, item, config, onChange, onConfirm }: WizardProviderConfigProps) {
  const { t } = useTranslation('common')
  const llmDef = panelType === 'llm' ? LLM_PROVIDER_CATALOG.find(d => d.id === item.id) : null
  const ttsDef = panelType === 'tts' ? VOICE_PROVIDER_CATALOG.find(e => e.id === item.id) : null

  const needsApiKey = llmDef?.requiresKey || ttsDef?.requiresApiKey
  const fixedEndpoint = llmDef?.fixedBaseUrl
  const editableEndpoint = llmDef?.defaultBaseUrl
  const extraFields = llmDef?.extraFields ?? []
  const description = llmDef?.description ?? ttsDef?.description ?? ''

  const hasFields = needsApiKey || editableEndpoint || extraFields.length > 0

  const credTest = useCredentialTest(item.id)

  useEffect(() => {
    credTest.reset()
    // credTest.reset is stable — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiKey])

  const handleClick = async () => {
    if (needsApiKey && config.apiKey && credTest.status === 'untested') {
      await credTest.test(config.apiKey, config.baseUrl ?? null)
      return
    }
    onConfirm()
  }

  const buttonLabel = credTest.testing
    ? t('wizard.testing')
    : credTest.status === 'verified'
      ? t('wizard.continueCheck')
      : credTest.status === 'failed'
        ? t('wizard.continueAnyway')
        : t('wizard.select', { name: item.name })

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
            <p className="home-ui-font truncate text-body font-semibold text-[var(--text-primary)]">{item.name}</p>
            {item.subtitle && (
              <p className="home-ui-font truncate text-[11.5px] text-[var(--text-tertiary)]">{item.subtitle}</p>
            )}
          </div>
        </div>
        {description && (
          <p className="home-ui-font mt-2.5 text-body leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
        {!hasFields && panelType === 'tts' && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/40 px-4 py-3">
            <p className="home-ui-font text-body leading-relaxed text-[var(--text-secondary)]">
              {t('wizard.noApiKey', { name: item.name })}
            </p>
            <p className="home-ui-font mt-1 text-xs text-[var(--text-tertiary)]">
              {t('wizard.voiceConfigHint')}
            </p>
          </div>
        )}

        {fixedEndpoint && (
          <div className="mb-4">
            <span className={labelCls}>{t('wizard.endpoint')}</span>
            <div className="flex h-9 items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]/60 px-3">
              <span className="home-ui-font text-[12.5px] text-[var(--text-tertiary)]">{fixedEndpoint}</span>
            </div>
          </div>
        )}

        {needsApiKey && (
          <div className="mb-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className={labelCls.replace('mb-1.5 ', '')}>{t('wizard.apiKey')}</span>
              {credTest.status !== 'untested' && (
                <CredentialStatusBadge status={credTest.status} error={credTest.error} />
              )}
            </div>
            <input
              type="password"
              value={config.apiKey ?? ''}
              onChange={e => onChange('apiKey', e.target.value)}
              placeholder={panelType === 'llm' ? t('wizard.apiKeyPlaceholder') : t('wizard.apiKey')}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        )}

        {editableEndpoint && (
          <div className="mb-4">
            <span className={labelCls}>{t('wizard.serverUrl')}</span>
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
              <p className="home-ui-font mb-1.5 text-xs text-[var(--text-tertiary)]">{field.hint}</p>
            )}
            <DynamicField
              field={field}
              value={config[field.key] ?? String(field.default ?? '')}
              onChange={v => onChange(field.key, v)}
            />
          </div>
        ))}

        {panelType === 'tts' && hasFields && (
          <p className="home-ui-font mt-1 text-xs text-[var(--text-tertiary)]">
            {t('wizard.voiceSettingsHint')}
          </p>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-[var(--border-subtle)] px-5 py-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={credTest.testing}
          className="home-ui-font flex h-9 w-full items-center justify-center rounded-xl text-body font-semibold text-white transition-colors hover:opacity-90 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent-base)' }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
