'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, RotateCw, Trash2 } from 'lucide-react'
import { useApp, useUpdateApp, useDeleteApp, useRotateSecret, useTestWebhook } from '@/features/developer/hooks/use-developer-apps'
import { SecretReveal } from '@/features/developer/components/secret-reveal'
import type { OAuthScope } from '@/features/developer/api/developer'

const ALL_SCOPES: { value: OAuthScope; label: string }[] = [
  { value: 'channelsRead', label: 'Read channels list' },
  { value: 'channelsWrite', label: 'Connect and disconnect channels' },
  { value: 'messagesReceive', label: 'Receive message notifications' },
  { value: 'soulRead', label: 'Read Soul card public info' },
]

export default function AppSettingsPage() {
  const { appId } = useParams<{ appId: string }>()
  const router = useRouter()

  const { data: app, isLoading } = useApp(appId)
  const updateApp = useUpdateApp(appId)
  const deleteApp = useDeleteApp()
  const rotateSecret = useRotateSecret(appId)
  const testWebhook = useTestWebhook(appId)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [redirectUris, setRedirectUris] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [scopes, setScopes] = useState<OAuthScope[]>([])
  const [rotatedSecret, setRotatedSecret] = useState<string | null>(null)
  const [copiedClientId, setCopiedClientId] = useState(false)
  const [formInit, setFormInit] = useState(false)

  // Initialize form once app is loaded
  if (app && !formInit) {
    setName(app.name)
    setDescription(app.description ?? '')
    setRedirectUris(app.redirectUris.join('\n'))
    setWebhookUrl(app.webhookUrl ?? '')
    setScopes(app.scopes)
    setFormInit(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const uris = redirectUris.split('\n').map(s => s.trim()).filter(Boolean)
    await updateApp.mutateAsync({ name, description: description || undefined, redirectUris: uris, webhookUrl: webhookUrl || undefined, scopes })
  }

  async function handleRotate() {
    if (!confirm('Rotate secret? The current secret will stop working immediately.')) return
    const result = await rotateSecret.mutateAsync()
    if (result.clientSecret) setRotatedSecret(result.clientSecret)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${app?.name}"? This cannot be undone.`)) return
    await deleteApp.mutateAsync(appId)
    router.push('/developer/apps')
  }

  async function copyClientId() {
    if (!app) return
    await navigator.clipboard.writeText(app.keycloakClientId)
    setCopiedClientId(true)
    setTimeout(() => setCopiedClientId(false), 2000)
  }

  if (isLoading) return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading…</div>
  if (!app) return <div className="p-8 text-sm text-[var(--text-secondary)]">Application not found.</div>

  return (
    <div className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-[var(--text-heading)]">{app.name}</h1>

      {/* Client Credentials */}
      <Section title="Client Credentials">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-[var(--text-tertiary)]">Client ID</p>
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2">
              <code className="flex-1 text-sm font-mono text-[var(--text-primary)] break-all">{app.keycloakClientId}</code>
              <button onClick={copyClientId} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                {copiedClientId ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {rotatedSecret ? (
            <SecretReveal secret={rotatedSecret} label="New Client Secret (save now)" />
          ) : (
            <button
              onClick={handleRotate}
              disabled={rotateSecret.isPending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] disabled:opacity-50 w-fit"
            >
              <RotateCw size={12} />
              {rotateSecret.isPending ? 'Rotating…' : 'Rotate Secret'}
            </button>
          )}
        </div>
      </Section>

      {/* Basic Info + OAuth Settings */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <Section title="Basic Info">
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <input required value={name} onChange={e => setName(e.target.value)} className="input-base" />
            </Field>
            <Field label="Description">
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="input-base resize-none" />
            </Field>
          </div>
        </Section>

        <Section title="OAuth Settings">
          <div className="flex flex-col gap-4">
            <Field label="Redirect URIs" hint="One URI per line">
              <textarea value={redirectUris} onChange={e => setRedirectUris(e.target.value)} rows={3} className="input-base resize-none font-mono text-xs" />
            </Field>
            <Field label="Requested Scopes">
              <div className="flex flex-col gap-2">
                {ALL_SCOPES.map(s => (
                  <label key={s.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={scopes.includes(s.value)}
                      onChange={e => setScopes(prev => e.target.checked ? [...prev, s.value] : prev.filter(x => x !== s.value))} />
                    <span className="text-sm">{s.label}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Webhook">
          <div className="flex flex-col gap-3">
            <Field label="Webhook URL">
              <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://myapp.com/webhooks/inktide" className="input-base" />
            </Field>
            <button
              type="button"
              onClick={() => testWebhook.mutate()}
              disabled={testWebhook.isPending || !app.webhookUrl}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] disabled:opacity-50 w-fit"
            >
              {testWebhook.isPending ? 'Sending…' : 'Test Webhook'}
            </button>
          </div>
        </Section>

        <button
          type="submit"
          disabled={updateApp.isPending}
          className="inline-flex h-9 w-fit items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-sm font-medium text-[var(--bg-0)] disabled:opacity-50"
        >
          {updateApp.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      <Section title="Danger Zone" danger>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Delete Application</p>
            <p className="text-xs text-[var(--text-tertiary)]">Permanently remove this app and revoke all tokens.</p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleteApp.isPending}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-red-500/30 text-xs font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-4 ${danger ? 'border-red-500/20' : 'border-[var(--border-subtle)]'}`}>
      <h2 className={`text-sm font-semibold ${danger ? 'text-red-400' : 'text-[var(--text-heading)]'}`}>{title}</h2>
      {children}
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
