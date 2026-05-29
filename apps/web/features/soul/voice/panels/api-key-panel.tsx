'use client'

import { useEffect, useState } from 'react'
import { getCredentials, upsertCredential, testCredential } from '@/features/soul/api/index'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { CredentialStatusBadge, statusFromCredential, type CredentialStatus } from '@/features/soul/components/credential-status-badge'
import { cn } from '@/lib/utils'
import { LockIcon } from '../voice-icons'
import { inputCls } from '../param-row'

interface ApiKeyConnectionPanelProps {
  providerName: string
  providerId: string
}

export function ApiKeyConnectionPanel({ providerName, providerId }: ApiKeyConnectionPanelProps) {
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const [inputKey, setInputKey]     = useState(selected?.tts?.apiKey ?? '')
  const [saving, setSaving]         = useState(false)
  const [testStatus, setTestStatus] = useState<CredentialStatus>('untested')
  const [testError, setTestError]   = useState<string | null>(null)

  useEffect(() => {
    getCredentials()
      .then((creds) => {
        const cred = creds.find((c) => c.providerId === providerId)
        if (cred?.hasKey) setTestStatus(statusFromCredential(cred.verifiedAt, cred.lastError))
      })
      .catch(() => {/* ignore */})
  }, [providerId])

  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  const handleSave = async () => {
    if (!inputKey.trim()) return
    setSaving(true)
    setTestStatus('testing')
    setTestError(null)
    try {
      await upsertCredential(providerId, inputKey)
      patch({ apiKey: inputKey })
      const result = await testCredential(providerId)
      setTestStatus(result.success ? 'verified' : 'failed')
      setTestError(result.error)
    } catch (err) {
      setTestStatus('failed')
      setTestError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
      <div className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <LockIcon />
            API Key
          </div>
          <CredentialStatusBadge status={testStatus} error={testError} />
        </div>
        <p className="mb-3 text-xs text-[var(--text-tertiary)]">Enter your {providerName} API key to connect.</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSave() }}
            placeholder="sk-..."
            autoComplete="new-password"
            className={cn(inputCls, 'flex-1')}
          />
          <button
            type="button"
            disabled={saving || !inputKey.trim()}
            onClick={() => void handleSave()}
            className="h-9 shrink-0 rounded-lg bg-[var(--accent-primary)] px-4 text-sm font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
