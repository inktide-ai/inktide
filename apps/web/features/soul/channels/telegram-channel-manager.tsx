'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  validateTelegramBotToken,
  createTelegramChannel,
  revokeTelegramChannel,
  type ChannelResponse,
} from '@/api/soul'
import { ApiError } from '@/api/client'
import { useChannelMutation } from '@/hooks/soul/useChannelMutation'

interface Props {
  soulId: string
  channels: ChannelResponse[]
}

export function TelegramChannelManager({ soulId, channels }: Props) {
  const [actionError, setActionError] = useState<string | null>(null)
  const [rowBusy,     setRowBusy]     = useState<string | null>(null)
  const [tgBotToken,  setTgBotToken]  = useState('')
  const [tgChatId,    setTgChatId]    = useState('')
  const [tgChatName,  setTgChatName]  = useState('')
  const [tgBotUser,   setTgBotUser]   = useState<string | null>(null)
  const [tgStatus,    setTgStatus]    = useState<'idle' | 'verifying' | 'verified' | 'saving' | 'failed'>('idle')
  const [tgError,     setTgError]     = useState<string | null>(null)

  const createMutation = useChannelMutation(
    soulId,
    ({ token, chatId, chatName }: { token: string; chatId: string; chatName: string }) =>
      createTelegramChannel(soulId, token, chatId, chatName),
  )
  const revokeMutation = useChannelMutation(soulId, (id: string) =>
    revokeTelegramChannel(id),
  )

  const handleVerify = async () => {
    if (!tgBotToken.trim()) return
    setTgStatus('verifying')
    setTgError(null)
    try {
      const result = await validateTelegramBotToken(tgBotToken.trim())
      if (result.valid) {
        setTgBotUser(result.username ?? null)
        setTgStatus('verified')
      } else {
        setTgStatus('failed')
        setTgError(result.error ?? 'Invalid bot token')
      }
    } catch {
      setTgStatus('failed')
      setTgError('Could not reach validation service')
    }
  }

  const handleSave = () => {
    if (!tgChatId.trim() || !tgChatName.trim()) return
    setTgStatus('saving')
    setTgError(null)
    createMutation.mutate(
      { token: tgBotToken.trim(), chatId: tgChatId.trim(), chatName: tgChatName.trim() },
      {
        onSuccess: () => {
          setTgBotToken(''); setTgChatId(''); setTgChatName('')
          setTgBotUser(null); setTgStatus('idle')
        },
        onError: (e) => {
          setTgStatus('failed')
          setTgError(e instanceof Error ? e.message : 'Failed to save')
        },
      },
    )
  }

  const handleRevoke = (row: ChannelResponse) => {
    if (!window.confirm(`Disconnect "${row.channel_name}" from Telegram? The bot will stop responding.`)) return
    setActionError(null)
    setRowBusy(row.id)
    revokeMutation.mutate(row.id, {
      onSettled: () => setRowBusy(null),
      onError: (e) => setActionError(e instanceof ApiError ? e.message : 'Failed to disconnect'),
    })
  }

  const inputCls = cn(
    'flex-1 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
    'text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors',
    'focus:border-[#0088cc]/50',
  )

  return (
    <>
      {channels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Connected channels</h3>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              Manage your connected Telegram channels.
            </p>
          </div>
          {actionError && <p className="px-6 pb-3 text-[14px] text-red-400">{actionError}</p>}
          <div className="border-t border-[var(--border-subtle)]">
            {channels.map((row, idx) => (
              <div
                key={row.id}
                className={cn(
                  'flex items-center gap-3 px-6 py-3.5',
                  idx > 0 && 'border-t border-[var(--border-subtle)]',
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold m-0 text-[var(--text-primary)]">{row.channel_name}</p>
                  <p className="text-[14px] font-mono m-0 text-[var(--text-secondary)] truncate">
                    {row.channel_id ?? '—'} · @{row.bot_username}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={rowBusy === row.id || revokeMutation.isPending}
                  onClick={() => handleRevoke(row)}
                  className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-[14px] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Disconnect"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="px-6 pt-5 pb-4">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Connect Telegram bot</h3>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Create a bot via{' '}
            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] hover:underline">
              @BotFather
            </a>
            , paste the token below, then add the bot to your group and enter the chat ID.
          </p>
        </div>
        <div className="px-6 pb-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="password"
              value={tgBotToken}
              onChange={e => { setTgBotToken(e.target.value); setTgStatus('idle'); setTgBotUser(null); setTgError(null) }}
              placeholder="Bot token from @BotFather…"
              autoComplete="off"
              className={inputCls}
            />
            <button
              type="button"
              disabled={!tgBotToken.trim() || tgStatus === 'verifying' || tgStatus === 'saving'}
              onClick={tgStatus === 'verified' ? handleSave : () => void handleVerify()}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg text-[14px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                tgStatus === 'verified'
                  ? 'bg-[#0088cc] text-white hover:bg-[#006ba3]'
                  : 'border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
              )}
            >
              {tgStatus === 'saving' ? 'Saving…' : tgStatus === 'verifying' ? 'Verifying…' : tgStatus === 'verified' ? 'Next →' : 'Verify'}
            </button>
          </div>

          {tgStatus === 'verified' && tgBotUser && (
            <p className="text-[14px] text-emerald-400">@{tgBotUser} verified — enter chat details below.</p>
          )}

          {tgStatus === 'verified' && (
            <>
              <input
                type="text"
                value={tgChatId}
                onChange={e => setTgChatId(e.target.value)}
                placeholder="Chat ID (e.g. -1001234567890)"
                autoComplete="off"
                className={inputCls}
              />
              <input
                type="text"
                value={tgChatName}
                onChange={e => setTgChatName(e.target.value)}
                placeholder="Display name (e.g. My Group)"
                autoComplete="off"
                className={inputCls}
              />
              <button
                type="button"
                disabled={!tgChatId.trim() || !tgChatName.trim()}
                onClick={handleSave}
                className="self-end px-4 py-2 rounded-lg bg-[#0088cc] text-white text-[14px] font-semibold hover:bg-[#006ba3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Connect
              </button>
            </>
          )}

          {tgStatus === 'failed' && tgError && (
            <p className="text-[14px] text-red-400">{tgError}</p>
          )}
        </div>
      </div>
    </>
  )
}
