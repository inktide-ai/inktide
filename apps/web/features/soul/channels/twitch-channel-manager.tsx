'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  getTwitchInstallUrl,
  reconnectTwitchChannel,
  revokeTwitchChannel,
  patchCardChannel,
  type ChannelResponse,
} from '@/api/soul'
import { ApiError } from '@/api/client'
import { useChannelMutation } from '@/hooks/soul/useChannelMutation'
import { saveOAuthPending } from './resolve-oauth-return'

function IconTwitchMono() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className="w-[22px] h-[22px]">
      <path d="M4.3 3L3 6.4v13.2h4.5V22l2.8-2.4h3.8L21 13V3H4.3zm15.1 9.3l-3 2.6h-4l-2.6 2.3v-2.3H6.7V4.6H19.4v7.7zM16 6.9h-1.5v4.1H16V6.9zm-3.8 0h-1.5v4.1h1.5V6.9z" />
    </svg>
  )
}

interface Props {
  soulId: string
  channels: ChannelResponse[]
}

export function TwitchChannelManager({ soulId, channels }: Props) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy,        setBusy]        = useState(false)
  const [rowBusy,     setRowBusy]     = useState<string | null>(null)

  const revokeMutation = useChannelMutation(soulId, (id: string) =>
    revokeTwitchChannel(id),
  )
  const toggleMutation = useChannelMutation(
    soulId,
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchCardChannel(soulId, id, { is_active: isActive }),
  )

  const handleConnect = async () => {
    setActionError(null)
    setBusy(true)
    try {
      const url = await getTwitchInstallUrl(soulId)
      saveOAuthPending({ soulId, connectorId: 'twitch', initiatedAt: Date.now() })
      window.location.href = url
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Failed to get Twitch authorization URL')
      setBusy(false)
    }
  }

  const handleReconnect = async (row: ChannelResponse) => {
    setActionError(null)
    setRowBusy(row.id)
    try {
      const url = await reconnectTwitchChannel(row.id)
      saveOAuthPending({ soulId, connectorId: 'twitch', initiatedAt: Date.now() })
      window.location.href = url
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Failed to reconnect')
    } finally {
      setRowBusy(null)
    }
  }

  const handleRevoke = (row: ChannelResponse) => {
    if (!window.confirm(`Disconnect "${row.channel_name}" from Twitch? The bot will leave the channel.`)) return
    setActionError(null)
    revokeMutation.mutate(row.id, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Failed to disconnect'),
    })
  }

  const handleToggle = (row: ChannelResponse, next: boolean) => {
    setActionError(null)
    toggleMutation.mutate({ id: row.id, isActive: next }, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Failed to update'),
    })
  }

  return (
    <>
      {channels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Connected channels</h3>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              Manage your connected Twitch channels.
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
                    <p className="text-[14px] font-semibold m-0 text-[var(--text-primary)]">#{row.channel_name}</p>
                    <p className="text-[14px] font-mono m-0 text-[var(--text-secondary)] truncate">
                      @{row.bot_username}
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
                      style={{ background: row.is_active ? '#9146ff' : 'rgba(128,128,128,0.22)' }}
                    />
                  </label>
                  <div className="flex items-center gap-1.5">
                    {!row.is_active && (
                      <button
                        type="button"
                        disabled={isRowBusy}
                        onClick={() => void handleReconnect(row)}
                        className="px-2.5 py-1 rounded-lg text-[14px] font-medium text-[#9146ff] border border-[#9146ff]/40 hover:bg-[#9146ff]/10 transition-colors disabled:opacity-40"
                      >
                        Reconnect
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isRowBusy}
                      onClick={() => handleRevoke(row)}
                      className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-[14px] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Disconnect"
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
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Add Twitch channel</h3>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Click below to authorize Inktide bot on your Twitch channel. You&apos;ll be redirected to Twitch to grant access.
          </p>
          {actionError && <p className="mt-3 text-[14px] text-red-400">{actionError}</p>}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleConnect()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[14px] bg-[#9146ff] hover:bg-[#7d34e6] text-white transition-[filter,opacity] duration-150 hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <IconTwitchMono />
            {busy ? 'Redirecting…' : 'Connect with Twitch'}
          </button>
        </div>
      </div>
    </>
  )
}
