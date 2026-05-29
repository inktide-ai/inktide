'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  getDiscordInstallUrl,
  reconnectDiscordChannel,
  revokeDiscordChannel,
  patchCardChannel,
  validateDiscordToken,
  saveDiscordCustomBot,
  createDiscordCustomBotChannel,
  type ChannelResponse,
} from '@/features/soul/api/index'
import { ApiError } from '@/api/client'
import { useChannelMutation } from '@/features/soul/hooks/useChannelMutation'
import { saveOAuthPending } from './resolve-oauth-return'

function IconDiscordMono() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className="w-[22px] h-[22px]">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

interface Props {
  soulId: string
  channels: ChannelResponse[]
}

export function DiscordChannelManager({ soulId, channels }: Props) {
  const { t } = useTranslation('channels')
  const [actionError,     setActionError]     = useState<string | null>(null)
  const [busy,            setBusy]            = useState(false)
  const [rowBusy,         setRowBusy]         = useState<string | null>(null)
  const [customBotToken,  setCustomBotToken]  = useState('')
  const [customBotStatus, setCustomBotStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed' | 'saving'>('idle')
  const [customBotError,  setCustomBotError]  = useState<string | null>(null)

  const revokeMutation = useChannelMutation(soulId, (id: string) =>
    revokeDiscordChannel(id),
  )
  const toggleMutation = useChannelMutation(
    soulId,
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchCardChannel(soulId, id, { is_active: isActive }),
  )
  const customBotSaveMutation = useChannelMutation(
    soulId,
    ({ existingChannelId, token }: { existingChannelId?: string; token: string }) =>
      existingChannelId
        ? saveDiscordCustomBot(existingChannelId, token)
        : createDiscordCustomBotChannel(soulId, token),
  )
  const customBotRemoveMutation = useChannelMutation(soulId, (channelId: string) =>
    saveDiscordCustomBot(channelId, null),
  )

  const handleConnect = async () => {
    setActionError(null)
    setBusy(true)
    try {
      const url = await getDiscordInstallUrl(soulId)
      saveOAuthPending({ soulId, connectorId: 'discord', initiatedAt: Date.now() })
      window.location.href = url
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t('discord.errors.getInstallUrl'))
      setBusy(false)
    }
  }

  const handleReconnect = async (row: ChannelResponse) => {
    setActionError(null)
    setRowBusy(row.id)
    try {
      const url = await reconnectDiscordChannel(row.id)
      saveOAuthPending({ soulId, connectorId: 'discord', initiatedAt: Date.now() })
      window.location.href = url
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : t('discord.errors.reconnect'))
    } finally {
      setRowBusy(null)
    }
  }

  const handleRevoke = (row: ChannelResponse) => {
    if (!window.confirm(t('discord.disconnectConfirm', { channel: row.channel_name }))) return
    setActionError(null)
    revokeMutation.mutate(row.id, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : t('discord.errors.disconnect')),
    })
  }

  const handleToggle = (row: ChannelResponse, next: boolean) => {
    setActionError(null)
    toggleMutation.mutate({ id: row.id, isActive: next }, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : t('discord.errors.update')),
    })
  }

  const handleCustomBotVerify = async () => {
    if (!customBotToken.trim()) return
    setCustomBotStatus('verifying')
    setCustomBotError(null)
    try {
      const result = await validateDiscordToken(customBotToken.trim())
      setCustomBotStatus(result.valid ? 'verified' : 'failed')
      setCustomBotError(result.valid ? null : (result.error ?? t('discord.errors.invalidToken')))
    } catch {
      setCustomBotStatus('failed')
      setCustomBotError(t('discord.errors.cannotReachValidation'))
    }
  }

  const handleCustomBotSave = (existingChannelId?: string) => {
    setCustomBotStatus('saving')
    setCustomBotError(null)
    customBotSaveMutation.mutate(
      { existingChannelId, token: customBotToken.trim() },
      {
        onSuccess: () => { setCustomBotToken(''); setCustomBotStatus('idle') },
        onError: (e) => {
          setCustomBotStatus('failed')
          setCustomBotError(e instanceof Error ? e.message : t('discord.errors.saveBotToken'))
        },
      },
    )
  }

  const handleCustomBotRemove = (channelId: string) => {
    if (!window.confirm(t('discord.removeCustomBotConfirm'))) return
    customBotRemoveMutation.mutate(channelId, {
      onError: (e) => setActionError(e instanceof Error ? e.message : t('discord.errors.removeCustomBot')),
    })
  }

  const existingCustom = channels.find(c => c.has_custom_bot)
  const isVerified     = customBotStatus === 'verified'
  const isSaving       = customBotStatus === 'saving'

  return (
    <>
      {channels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('discord.connectedChannels')}</h3>
            <p className="mt-1 text-body text-[var(--text-secondary)]">
              {t('discord.connectedDesc')}
            </p>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            {channels.map((row, idx) => {
              const isRowBusy = rowBusy === row.id || revokeMutation.isPending || toggleMutation.isPending
              return (
                <div
                  key={row.id}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3.5',
                    idx > 0 && 'border-t border-[var(--border-subtle)]',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold m-0 text-[var(--text-primary)]">{row.channel_name}</p>
                    <p className="text-body font-mono m-0 text-[var(--text-secondary)] truncate">
                      {row.channel_id ?? '—'} · @{row.bot_username}
                    </p>
                  </div>
                  <label className="integration-toggle shrink-0">
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      disabled={isRowBusy}
                      onChange={e => handleToggle(row, e.target.checked)}
                    />
                    <span
                      className="integration-toggle-slider"
                      style={{ background: row.is_active ? 'var(--accent-primary)' : 'rgba(128,128,128,0.22)' }}
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {!row.is_active && (
                      <button
                        type="button"
                        disabled={isRowBusy}
                        onClick={() => void handleReconnect(row)}
                        className="px-2.5 py-1 rounded-lg text-body font-medium text-[var(--platform-discord)] border border-[var(--platform-discord)]/40 hover:bg-[var(--platform-discord)]/10 transition-colors disabled:opacity-40"
                      >
                        {t('discord.reconnect')}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => handleRevoke(row)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-body text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={t('discord.disconnect')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="px-6 pt-5 pb-5">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('discord.addServer')}</h3>
          <p className="mt-1 text-body text-[var(--text-secondary)]">
            {t('discord.addServerDesc')}
          </p>
          {actionError && <p className="mt-3 text-body text-red-400">{actionError}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConnect()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-body bg-[var(--platform-discord)] hover:bg-[#4752c4] text-white transition-[filter,opacity] duration-150 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <IconDiscordMono />
            {busy ? t('discord.redirecting') : t('discord.connectWithDiscord')}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="px-6 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('discord.ownBot')}</h3>
            {existingCustom && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                {t('discord.connected')}
              </span>
            )}
          </div>
          <p className="mt-1 text-body text-[var(--text-secondary)]">
            {t('discord.ownBotDesc')}
          </p>
        </div>
        <div className="px-6 pb-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="password"
              value={customBotToken}
              onChange={e => { setCustomBotToken(e.target.value); setCustomBotStatus('idle'); setCustomBotError(null) }}
              placeholder={t('discord.botTokenPlaceholder')}
              autoComplete="off"
              className={cn(
                'flex-1 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
                'text-body text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors',
                'focus:border-[var(--platform-discord)]/50',
              )}
            />
            <button
              type="button"
              disabled={!customBotToken.trim() || customBotStatus === 'verifying' || isSaving}
              onClick={isVerified
                ? () => handleCustomBotSave(existingCustom?.id)
                : () => void handleCustomBotVerify()
              }
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg text-body font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                isVerified
                  ? 'bg-[var(--platform-discord)] text-white hover:bg-[#4752c4]'
                  : 'border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
              )}
            >
              {isSaving ? t('discord.saving') : customBotStatus === 'verifying' ? t('discord.verifying') : isVerified ? 'Save' : t('discord.verify')}
            </button>
          </div>
          {customBotStatus === 'verified' && (
            <p className="text-body text-emerald-400">{t('discord.tokenVerified')}</p>
          )}
          {customBotStatus === 'failed' && customBotError && (
            <p className="text-body text-red-400">{customBotError}</p>
          )}
          {existingCustom && !customBotToken && (
            <button
              type="button"
              disabled={customBotRemoveMutation.isPending}
              onClick={() => handleCustomBotRemove(existingCustom.id)}
              className="self-start text-body text-red-400 hover:text-red-300 transition-colors disabled:opacity-40"
            >
              {t('discord.removeCustomBot')}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
