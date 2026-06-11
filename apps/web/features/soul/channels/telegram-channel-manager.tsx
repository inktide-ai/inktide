'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  validateTelegramBotToken,
  createTelegramChannel,
  revokeTelegramChannel,
  type ChannelResponse,
} from '@/features/soul/api/index'
import { ApiError } from '@/api/client'
import { useChannelMutation } from '@/features/soul/hooks/useChannelMutation'

interface Props {
  soulId: string
  channels: ChannelResponse[]
}

export function TelegramChannelManager({ soulId, channels }: Props) {
  const { t } = useTranslation('channels')
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
        setTgError(result.error ?? t('telegram.mgrInvalidToken'))
      }
    } catch {
      setTgStatus('failed')
      setTgError(t('telegram.mgrValidationService'))
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
          setTgError(e instanceof Error ? e.message : t('telegram.mgrSaveFailed'))
        },
      },
    )
  }

  const handleRevoke = (row: ChannelResponse) => {
    if (!window.confirm(t('telegram.mgrConfirmDisconnect', { channel: row.channel_name }))) return
    setActionError(null)
    setRowBusy(row.id)
    revokeMutation.mutate(row.id, {
      onSettled: () => setRowBusy(null),
      onError: (e) => setActionError(e instanceof ApiError ? e.message : t('telegram.mgrDisconnectFailed')),
    })
  }

  const inputCls = cn(
    'flex-1 h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
    'text-body text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] transition-colors',
    'focus:border-[var(--platform-telegram)]/50',
  )

  return (
    <>
      {channels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('telegram.mgrConnectedTitle')}</h3>
            <p className="mt-1 text-body text-[var(--text-secondary)]">
              {t('telegram.mgrConnectedDesc')}
            </p>
          </div>
          {actionError && <p className="px-6 pb-3 text-body text-red-400">{actionError}</p>}
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
                  <p className="text-body font-semibold m-0 text-[var(--text-primary)]">{row.channel_name}</p>
                  <p className="text-body font-mono m-0 text-[var(--text-secondary)] truncate">
                    {row.channel_id ?? '—'} · @{row.bot_username}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={rowBusy === row.id || revokeMutation.isPending}
                  onClick={() => handleRevoke(row)}
                  className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-body text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={t('telegram.mgrDisconnect')}
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
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{t('telegram.mgrConnectTitle')}</h3>
          <p className="mt-1 text-body text-[var(--text-secondary)]">
            {t('telegram.mgrConnectDescBefore')}{' '}
            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] hover:underline">
              @BotFather
            </a>
            {t('telegram.mgrConnectDescAfter')}
          </p>
        </div>
        <div className="px-6 pb-5 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="password"
              value={tgBotToken}
              onChange={e => { setTgBotToken(e.target.value); setTgStatus('idle'); setTgBotUser(null); setTgError(null) }}
              placeholder={t('telegram.mgrTokenPlaceholder')}
              autoComplete="off"
              className={inputCls}
            />
            <button
              type="button"
              disabled={!tgBotToken.trim() || tgStatus === 'verifying' || tgStatus === 'saving'}
              onClick={tgStatus === 'verified' ? handleSave : () => void handleVerify()}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg text-body font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                tgStatus === 'verified'
                  ? 'bg-[var(--platform-telegram)] text-white hover:bg-[#006ba3]'
                  : 'border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
              )}
            >
              {tgStatus === 'saving' ? t('telegram.mgrSaving') : tgStatus === 'verifying' ? t('telegram.mgrVerifying') : tgStatus === 'verified' ? t('telegram.mgrNext') : t('telegram.mgrVerify')}
            </button>
          </div>

          {tgStatus === 'verified' && tgBotUser && (
            <p className="text-body text-emerald-400">{t('telegram.mgrVerified', { user: tgBotUser })}</p>
          )}

          {tgStatus === 'verified' && (
            <>
              <input
                type="text"
                value={tgChatId}
                onChange={e => setTgChatId(e.target.value)}
                placeholder={t('telegram.mgrChatIdPlaceholder')}
                autoComplete="off"
                className={inputCls}
              />
              <input
                type="text"
                value={tgChatName}
                onChange={e => setTgChatName(e.target.value)}
                placeholder={t('telegram.mgrDisplayNamePlaceholder')}
                autoComplete="off"
                className={inputCls}
              />
              <button
                type="button"
                disabled={!tgChatId.trim() || !tgChatName.trim()}
                onClick={handleSave}
                className="self-end px-4 py-2 rounded-lg bg-[var(--platform-telegram)] text-white text-body font-semibold hover:bg-[#006ba3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('telegram.mgrConnect')}
              </button>
            </>
          )}

          {tgStatus === 'failed' && tgError && (
            <p className="text-body text-red-400">{tgError}</p>
          )}
        </div>
      </div>
    </>
  )
}
