'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { SecretReveal } from '@/features/developer/components/secret-reveal'
import { useCreateApp } from '@/features/developer/hooks/use-developer-apps'
import type { OAuthScope } from '@/features/developer/api/developer'

const ALL_SCOPES: { value: OAuthScope; labelKey: string }[] = [
  { value: 'channelsRead', labelKey: 'scopes.channelsRead' },
  { value: 'channelsWrite', labelKey: 'scopes.channelsWrite' },
  { value: 'messagesReceive', labelKey: 'scopes.messagesReceive' },
  { value: 'soulRead', labelKey: 'scopes.soulRead' },
]

export default function NewAppPage() {
  const router = useRouter()
  const { t } = useTranslation('developer')
  const createApp = useCreateApp()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [redirectUris, setRedirectUris] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [scopes, setScopes] = useState<OAuthScope[]>([])
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const uris = redirectUris.split('\n').map(s => s.trim()).filter(Boolean)
    const result = await createApp.mutateAsync({
      name, description: description || undefined,
      redirectUris: uris,
      webhookUrl: webhookUrl || undefined,
      webhookSecret: webhookSecret || undefined,
      scopes,
    })
    if (result.clientSecret) {
      setCreatedSecret(result.clientSecret)
    }
  }

  if (createdSecret) {
    return (
      <div className="mx-auto max-w-[1300px] px-6 py-10 flex flex-col gap-6">
        <h1 className="text-xl font-semibold text-[var(--text-heading)]">{t('new.created')}</h1>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 flex flex-col gap-3">
          <p className="text-sm font-medium text-amber-400">{t('new.saveSecret')}</p>
          <SecretReveal secret={createdSecret} label={t('new.clientSecret')} />
        </div>
        <button
          onClick={() => router.push('/developer/apps')}
          className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-sm font-medium text-[var(--bg-0)]"
        >
          {t('new.goToMyApps')}
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1300px] px-6 py-10 flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-[var(--text-heading)]">{t('new.title')}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label={t('new.nameLabel')}>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('new.namePlaceholder')}
            className="input-base"
          />
        </Field>

        <Field label={t('new.descriptionLabel')}>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            placeholder={t('new.descriptionPlaceholder')}
            className="input-base resize-none"
          />
        </Field>

        <Field label={t('new.redirectUrisLabel')} hint={t('new.redirectUrisHint')}>
          <textarea
            required
            value={redirectUris}
            onChange={e => setRedirectUris(e.target.value)}
            rows={3}
            placeholder="https://myapp.com/callback"
            className="input-base resize-none font-mono text-xs"
          />
        </Field>

        <Field label={t('new.webhookUrlLabel')} hint={t('new.webhookUrlHint')}>
          <input
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://myapp.com/webhooks/inktide"
            className="input-base"
          />
        </Field>

        <Field label={t('new.webhookSecretLabel')} hint={t('new.webhookSecretHint')}>
          <input
            value={webhookSecret}
            onChange={e => setWebhookSecret(e.target.value)}
            type="password"
            placeholder={t('new.webhookSecretPlaceholder')}
            className="input-base"
          />
        </Field>

        <Field label={t('new.scopesLabel')}>
          <div className="flex flex-col gap-2">
            {ALL_SCOPES.map(s => (
              <label key={s.value} className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scopes.includes(s.value)}
                  onChange={e => setScopes(prev =>
                    e.target.checked ? [...prev, s.value] : prev.filter(x => x !== s.value)
                  )}
                  className="rounded"
                />
                <span className="text-sm text-[var(--text-primary)]">{t(s.labelKey)}</span>
              </label>
            ))}
          </div>
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createApp.isPending}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-sm font-medium text-[var(--bg-0)] disabled:opacity-50"
          >
            {createApp.isPending ? t('new.creating') : t('new.create')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-subtle)] px-5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
          >
            {t('new.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
      {hint && <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>}
      {children}
    </div>
  )
}
