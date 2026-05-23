'use client'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import {
  createCardChannel,
  patchCardChannel,
  deleteCardChannel,
  type ChannelResponse,
  type ChannelPlatform,
} from '@/api/soul'
import { ApiError } from '@/api/client'
import { CHANNEL_STATIC } from '@/data/channel-platforms'
import { useChannelMutation } from '@/hooks/soul/useChannelMutation'

type FormFields = { channelId: string; displayName: string; botUsername: string }
const emptyForm = (): FormFields => ({ channelId: '', displayName: '', botUsername: '' })

interface Props {
  soulId: string
  connectorId: ChannelPlatform
  channels: ChannelResponse[]
}

export function GenericChannelForm({ soulId, connectorId, channels }: Props) {
  const { t } = useTranslation('channels')
  const [form,        setForm]        = useState<FormFields>(emptyForm())
  const [actionError, setActionError] = useState<string | null>(null)

  const sc = CHANNEL_STATIC[connectorId]

  const addMutation = useChannelMutation(
    soulId,
    (fields: FormFields) =>
      createCardChannel(soulId, {
        platform:     connectorId,
        channel_id:   fields.channelId,
        channel_name: fields.displayName,
        bot_username: fields.botUsername,
      }),
  )
  const toggleMutation = useChannelMutation(
    soulId,
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchCardChannel(soulId, id, { is_active: isActive }),
  )
  const removeMutation = useChannelMutation(soulId, (id: string) =>
    deleteCardChannel(soulId, id),
  )

  const handleAdd = () => {
    const cid   = form.channelId.trim()
    const label = form.displayName.trim()
    const bot   = form.botUsername.trim()
    if (!sc.validateChannelId(cid)) {
      setActionError(t(`${connectorId}.validationError`)); return
    }
    if (!label) { setActionError(t('error.displayNameRequired')); return }
    if (!bot)   { setActionError(t('error.botNameRequired'));     return }
    setActionError(null)
    addMutation.mutate(
      { channelId: cid, displayName: label, botUsername: bot },
      {
        onSuccess: () => setForm(emptyForm()),
        onError: (e) => setActionError(e instanceof ApiError ? e.message : t('error.add')),
      },
    )
  }

  const handleToggle = (row: ChannelResponse, next: boolean) => {
    setActionError(null)
    toggleMutation.mutate({ id: row.id, isActive: next }, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : t('error.update')),
    })
  }

  const handleRemove = (row: ChannelResponse) => {
    if (!window.confirm(t('confirm', { label: t(`${connectorId}.removeLabel`), channel: row.channel_name }))) return
    setActionError(null)
    removeMutation.mutate(row.id, {
      onError: (e) => setActionError(e instanceof ApiError ? e.message : t('error.remove')),
    })
  }

  const fieldCls = cn(
    'w-full rounded-xl border px-3 py-2.5 text-[0.875rem] outline-none transition-[border-color,box-shadow] duration-150',
    'border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
    'focus:border-[var(--border-default)] focus:ring-0 focus:shadow-[0_0_0_2px_rgba(255,255,255,0.08)]',
  )

  return (
    <>
      {channels.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
          <div className="px-6 pt-5 pb-4">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Connected channels</h3>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              Manage your connected {t(`${connectorId}.title`)} channels.
            </p>
          </div>
          <div className="border-t border-[var(--border-subtle)]">
            {channels.map((row, idx) => {
              const isRowBusy = toggleMutation.isPending || removeMutation.isPending
              return (
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
                  <button
                    type="button"
                    disabled={isRowBusy}
                    onClick={() => handleRemove(row)}
                    className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-[14px] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]">
        <div className="px-6 pt-5 pb-2">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Add a channel</h3>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Connect a new {t(`${connectorId}.title`)} channel to this soul.
          </p>
        </div>
        <div className="px-6 pb-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-channelId" className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
              {t(`${connectorId}.channelIdLabel`)}
            </label>
            <input
              id="field-channelId"
              className={fieldCls}
              value={form.channelId}
              onChange={e => setForm(f => ({ ...f, channelId: e.target.value }))}
              placeholder={t(`${connectorId}.channelIdPlaceholder`)}
              autoComplete="off"
            />
            {t(`${connectorId}.channelIdHint`) && (
              <span className="text-[14px] text-[var(--text-secondary)] leading-snug">
                {t(`${connectorId}.channelIdHint`)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-displayName" className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
              {t('form.displayName')}
            </label>
            <input
              id="field-displayName"
              className={fieldCls}
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              placeholder={t('form.displayNamePlaceholder')}
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="field-botUsername" className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-secondary)]">
              {t('form.botName')}
            </label>
            <input
              id="field-botUsername"
              className={fieldCls}
              value={form.botUsername}
              onChange={e => setForm(f => ({ ...f, botUsername: e.target.value }))}
              placeholder={t('form.botNamePlaceholder')}
              autoComplete="off"
            />
          </div>

          {actionError && <p className="text-[14px] text-red-400 m-0">{actionError}</p>}
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            disabled={addMutation.isPending}
            onClick={handleAdd}
            className={cn(
              'px-4 py-2 rounded-lg font-semibold text-[14px] transition-[filter,opacity] duration-150',
              'hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed',
              sc.addBtn,
            )}
          >
            {addMutation.isPending ? t('status.adding') : t(`${connectorId}.addLabel`)}
          </button>
        </div>
      </div>
    </>
  )
}
