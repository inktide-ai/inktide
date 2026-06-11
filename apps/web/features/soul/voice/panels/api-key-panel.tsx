'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getTtsCredentials, upsertTtsCredential } from '@/entities/soul/api/tts-credentials'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { CredentialStatusBadge, statusFromCredential } from '@/features/soul/components/credential-status-badge'
import type { CredentialStatus } from '@/features/soul/components/credential-status-badge'
import { cn } from '@/lib/utils'
import { LockIcon } from '../voice-icons'
import { inputCls } from '../param-row'

interface ApiKeyConnectionPanelProps {
  providerName: string
  providerId: string
}

export function ApiKeyConnectionPanel({ providerName, providerId }: ApiKeyConnectionPanelProps) {
  const { t } = useTranslation('voice')
  const { selected, selectedId, updateCharacter } = useCharactersContext()
  const [inputKey, setInputKey] = useState('')
  const [status, setStatus] = useState<CredentialStatus>('untested')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTtsCredentials()
      .then((creds) => {
        const cred = creds.find((c) => c.providerId === providerId)
        if (cred?.hasKey) setStatus(statusFromCredential(cred.verifiedAt, cred.lastError))
      })
      .catch(() => {})
    // setStatus is a stable useState setter — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId])

  if (!selected || !selectedId) return null
  const tts = selected.tts
  const patch = (p: Partial<typeof tts>) => updateCharacter(selectedId, { tts: { ...tts, ...p } })

  const handleSave = async () => {
    if (!inputKey.trim()) return
    setSaving(true)
    try {
      await upsertTtsCredential(providerId, inputKey)
      // Keep key in character config for voice listing until backend voice listing uses stored credentials
      patch({ apiKey: inputKey })
      setStatus('verified')
      setInputKey('')
    } catch {
      setStatus('failed')
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
            {t('panels.apiKey')}
          </div>
          <CredentialStatusBadge status={status} />
        </div>
        <p className="mb-3 text-xs text-[var(--text-tertiary)]">{t('panels.apiKeyConnectDesc', { name: providerName })}</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={inputKey}
            onChange={(e) => { setInputKey(e.target.value) }}
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
            {saving ? t('panels.saving') : t('panels.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
