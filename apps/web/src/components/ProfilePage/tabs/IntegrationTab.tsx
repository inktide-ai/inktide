import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  createCardChannel,
  deleteCardChannel,
  getCard,
  patchCardChannel,
  type ChannelResponse,
  type IntegrationPlatform,
} from '../../../api/soul'
import { ApiError } from '../../../api/client'
import type { AiCharacter } from '../../../domain/character'
import pageStyles from '../ProfilePage.module.css'
import styles from './IntegrationTab.module.css'

interface IntegrationTabProps {
  character: AiCharacter
  onUpdate?: (patch: Partial<AiCharacter>) => void
}

const DISCORD_SNOWFLAKE = /^\d{17,20}$/
const INGEST_CHANNEL_ID = /^[a-zA-Z0-9_\-]{1,100}$/

type FormFields = { channelId: string; displayName: string; botUsername: string }

const emptyForm = (): FormFields => ({ channelId: '', displayName: '', botUsername: '' })

type PanelTheme = 'discord' | 'twitch' | 'kick' | 'vk'

interface PlatformConfig {
  id: IntegrationPlatform
  theme: PanelTheme
  title: string
  subtitle: string
  hintLink?: string
  channelIdLabel: string
  channelIdPlaceholder: string
  channelIdHint: string
  addLabel: string
  listTitle: string
  emptyList: string
  validateChannelId: (value: string) => string | null
  removeLabel: string
}

// PLATFORM_CONFIG is built inside IntegrationTab via useMemo to support i18n

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={expanded ? styles.chevronExpanded : styles.chevron}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function IconDiscord() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.markSvg}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

function IconTwitch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.markSvg}>
      <path d="M11.571 4.714h1.715v5.143H11.57V4.714zm4.715 0H18v5.143h-1.714V4.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22 14.571V0H6zm14.571 13.714h-1.714V9.857h1.714v3.857zm0-5.143h-1.714V4.714h1.714v3.857z" />
    </svg>
  )
}

function IconKick() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.markSvg}>
      <path d="M4 4h4.5L14 10.5V20h-4v-6H8v6H4V4zm10.5 0H20v7l-2.5 2.5L20 16v4h-4v-4l-3-3V7.5L14.5 4z" />
    </svg>
  )
}

function IconVk() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden fill="currentColor" className={styles.markSvg}>
      <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.27 14.27h-1.77c-.66 0-.86-.52-2-1.69-1-.94-1.44-1.07-1.69-1.07-.35 0-.45.1-.45.58v1.55c0 .42-.13.67-1.18.67-1.73 0-3.66-1.05-5.02-3.01-2.05-2.86-2.61-5.03-2.61-5.47 0-.22.1-.42.58-.42h1.77c.43 0 .59.2.76.67.84 2.45 2.25 4.6 2.83 4.6.22 0 .32-.1.32-.67V8.42c-.06-.98-.57-1.06-.57-1.41 0-.17.14-.33.38-.33h2.77c.47 0 .64.25.64.8v4.35c0 .47.21.64.34.64.22 0 .41-.13.82-.52 1.27-1.42 2.18-3.62 2.18-3.62.11-.28.3-.5.88-.5h1.77c.59 0 .72.31.59.73 0 0-1.28 3.02-1.88 4.07-.95 1.78-1.35 1.89-1.87 1.89-.35 0-.45-.1-.45-.58v-1.06c0-.42-.14-.49-.45-.49-.35 0-.95.35-1.88 1.47-1.2 1.45-1.53 2.64-1.53 3.09 0 .25.06.47.58.47h1.77c.44 0 .6.2.48.67-.12.45-.58 1.95-1.23 2.95-.95 1.45-2 2.12-2.88 2.12z" />
    </svg>
  )
}

function PlatformMark({ theme }: { theme: PanelTheme }) {
  switch (theme) {
    case 'discord':
      return <IconDiscord />
    case 'twitch':
      return <IconTwitch />
    case 'kick':
      return <IconKick />
    case 'vk':
      return <IconVk />
    default:
      return null
  }
}

const IntegrationTab = ({ character }: IntegrationTabProps) => {
  const { t } = useTranslation('integrations')

  const PLATFORM_CONFIG = useMemo((): PlatformConfig[] => [
    {
      id: 'discord',
      theme: 'discord',
      title: t('discord.title'),
      subtitle: t('discord.subtitle'),
      hintLink: t('discord.hintLink'),
      channelIdLabel: t('discord.channelIdLabel'),
      channelIdPlaceholder: t('discord.channelIdPlaceholder'),
      channelIdHint: t('discord.channelIdHint'),
      addLabel: t('discord.addLabel'),
      listTitle: t('discord.listTitle'),
      emptyList: t('discord.emptyList'),
      validateChannelId: (v) => DISCORD_SNOWFLAKE.test(v.trim()) ? null : t('discord.validationError'),
      removeLabel: t('discord.removeLabel'),
    },
    {
      id: 'twitch',
      theme: 'twitch',
      title: t('twitch.title'),
      subtitle: t('twitch.subtitle'),
      channelIdLabel: t('twitch.channelIdLabel'),
      channelIdPlaceholder: t('twitch.channelIdPlaceholder'),
      channelIdHint: t('twitch.channelIdHint'),
      addLabel: t('twitch.addLabel'),
      listTitle: t('twitch.listTitle'),
      emptyList: t('twitch.emptyList'),
      validateChannelId: (v) => INGEST_CHANNEL_ID.test(v.trim()) ? null : t('twitch.validationError'),
      removeLabel: t('twitch.removeLabel'),
    },
    {
      id: 'kick',
      theme: 'kick',
      title: t('kick.title'),
      subtitle: t('kick.subtitle'),
      channelIdLabel: t('kick.channelIdLabel'),
      channelIdPlaceholder: t('kick.channelIdPlaceholder'),
      channelIdHint: t('kick.channelIdHint'),
      addLabel: t('kick.addLabel'),
      listTitle: t('kick.listTitle'),
      emptyList: t('kick.emptyList'),
      validateChannelId: (v) => INGEST_CHANNEL_ID.test(v.trim()) ? null : t('kick.validationError'),
      removeLabel: t('kick.removeLabel'),
    },
    {
      id: 'vk_video',
      theme: 'vk',
      title: t('vk_video.title'),
      subtitle: t('vk_video.subtitle'),
      channelIdLabel: t('vk_video.channelIdLabel'),
      channelIdPlaceholder: t('vk_video.channelIdPlaceholder'),
      channelIdHint: t('vk_video.channelIdHint'),
      addLabel: t('vk_video.addLabel'),
      listTitle: t('vk_video.listTitle'),
      emptyList: t('vk_video.emptyList'),
      validateChannelId: (v) => INGEST_CHANNEL_ID.test(v.trim()) ? null : t('vk_video.validationError'),
      removeLabel: t('vk_video.removeLabel'),
    },
  ], [t])

  const [open, setOpen] = useState<Record<IntegrationPlatform, boolean>>({
    discord: false,
    twitch: false,
    kick: false,
    vk_video: false,
  })

  const [forms, setForms] = useState<Record<IntegrationPlatform, FormFields>>({
    discord: emptyForm(),
    twitch: emptyForm(),
    kick: emptyForm(),
    vk_video: emptyForm(),
  })

  const [channels, setChannels] = useState<ChannelResponse[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<{ platform: IntegrationPlatform; message: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [busyPlatform, setBusyPlatform] = useState<IntegrationPlatform | null>(null)
  const [rowBusy, setRowBusy] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoadError(null)
    try {
      const card = await getCard(character.id)
      setChannels(card.channels ?? [])
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('error.load')
      setLoadError(msg)
      setChannels([])
    }
  }, [character.id, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const rowsByPlatform = useMemo(() => {
    const map = new Map<IntegrationPlatform, ChannelResponse[]>()
    for (const p of PLATFORM_CONFIG) {
      map.set(
        p.id,
        (channels ?? []).filter((c) => c.platform.toLowerCase() === p.id),
      )
    }
    return map
  }, [channels, PLATFORM_CONFIG])

  const setForm = (platform: IntegrationPlatform, patch: Partial<FormFields>) => {
    setForms((prev) => ({ ...prev, [platform]: { ...prev[platform], ...patch } }))
  }

  const handleAdd = async (cfg: PlatformConfig) => {
    setActionError(null)
    const f = forms[cfg.id]
    const cid = f.channelId.trim()
    const label = f.displayName.trim()
    const bot = f.botUsername.trim()

    const idErr = cfg.validateChannelId(cid)
    if (idErr) {
      setActionError({ platform: cfg.id, message: idErr })
      return
    }
    if (!label) {
      setActionError({ platform: cfg.id, message: t('error.displayNameRequired') })
      return
    }
    if (!bot) {
      setActionError({ platform: cfg.id, message: t('error.botNameRequired') })
      return
    }

    setBusy(true)
    setBusyPlatform(cfg.id)
    try {
      await createCardChannel(character.id, {
        platform: cfg.id,
        channel_id: cid,
        channel_name: label,
        bot_username: bot,
      })
      setForm(cfg.id, { channelId: '', displayName: '', botUsername: '' })
      setActionError(null)
      await refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('error.add')
      setActionError({ platform: cfg.id, message: msg })
    } finally {
      setBusy(false)
      setBusyPlatform(null)
    }
  }

  const platformFromRow = (row: ChannelResponse): IntegrationPlatform | null => {
    const p = row.platform.toLowerCase()
    if (p === 'discord' || p === 'twitch' || p === 'kick' || p === 'vk_video') return p
    return null
  }

  const toggleRow = async (row: ChannelResponse, next: boolean) => {
    setRowBusy(row.id)
    setActionError(null)
    try {
      await patchCardChannel(character.id, row.id, { is_active: next })
      await refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('error.update')
      const pl = platformFromRow(row)
      if (pl) setActionError({ platform: pl, message: msg })
    } finally {
      setRowBusy(null)
    }
  }

  const removeRow = async (row: ChannelResponse, label: string) => {
    if (!window.confirm(t('confirm', { label, channel: row.channel_name }))) return
    setRowBusy(row.id)
    setActionError(null)
    try {
      await deleteCardChannel(character.id, row.id)
      await refresh()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('error.remove')
      const pl = platformFromRow(row)
      if (pl) setActionError({ platform: pl, message: msg })
    } finally {
      setRowBusy(null)
    }
  }

  const addBtnClass = (theme: PanelTheme) => {
    switch (theme) {
      case 'discord':
        return styles.btnAddDiscord
      case 'twitch':
        return styles.btnAddTwitch
      case 'kick':
        return styles.btnAddKick
      case 'vk':
        return styles.btnAddVk
      default:
        return styles.btnAddDiscord
    }
  }

  return (
    <div className={pageStyles.tabRoot}>
      <div className={pageStyles.section}>
        <div className={pageStyles.sectionTitle}>{t('section.title')}</div>
        <p className={styles.intro}>
          {t('intro')}
        </p>
      </div>

      <div className={styles.sectionStack}>
      {PLATFORM_CONFIG.map((cfg) => {
        const isOpen = open[cfg.id]
        const panelCls =
          cfg.theme === 'discord'
            ? styles.panelDiscord
            : cfg.theme === 'twitch'
              ? styles.panelTwitch
              : cfg.theme === 'kick'
                ? styles.panelKick
                : styles.panelVk

        return (
          <div key={cfg.id} className={`${styles.panel} ${panelCls}`}>
            <button
              type="button"
              className={`${styles.panelHeader} ${isOpen ? styles.panelHeaderOpen : ''}`}
              onClick={() => setOpen((o) => ({ ...o, [cfg.id]: !o[cfg.id] }))}
              aria-expanded={isOpen}
              aria-controls={`integration-body-${cfg.id}`}
              id={`integration-trigger-${cfg.id}`}
            >
              <div className={styles.panelHeaderMain}>
                <div className={styles.panelMark} aria-hidden>
                  <PlatformMark theme={cfg.theme} />
                </div>
                <div className={styles.panelTitleBlock}>
                  <span className={styles.panelTitle}>{cfg.title}</span>
                  <span className={styles.panelSubtitle}>{cfg.subtitle}</span>
                </div>
              </div>
              <ChevronIcon expanded={isOpen} />
            </button>

            <div
              id={`integration-body-${cfg.id}`}
              role="region"
              aria-labelledby={`integration-trigger-${cfg.id}`}
              aria-hidden={!isOpen}
              className={isOpen ? styles.panelBodyWrapOpen : styles.panelBodyWrap}
            >
              <div className={styles.panelBodyInner}>
                <div className={styles.hintBox}>
                  <Trans
                    i18nKey={`${cfg.id}.hint`}
                    ns="integrations"
                    components={{
                      strong: <strong />,
                      code: <code />,
                      a: cfg.hintLink
                        ? <a href={cfg.hintLink} target="_blank" rel="noreferrer" />
                        : <span />,
                    }}
                  />
                </div>

                {loadError && <p className={styles.error}>{loadError}</p>}

                {channels === null && !loadError && (
                  <div className={styles.loading}>{t('status.loading')}</div>
                )}

                <div className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`ch-id-${cfg.id}`}>
                      {cfg.channelIdLabel}
                    </label>
                    <input
                      id={`ch-id-${cfg.id}`}
                      className={styles.input}
                      value={forms[cfg.id].channelId}
                      onChange={(e) => setForm(cfg.id, { channelId: e.target.value })}
                      placeholder={cfg.channelIdPlaceholder}
                      autoComplete="off"
                    />
                    <span className={styles.fieldHint}>{cfg.channelIdHint}</span>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`ch-name-${cfg.id}`}>
                      {t('form.displayName')}
                    </label>
                    <input
                      id={`ch-name-${cfg.id}`}
                      className={styles.input}
                      value={forms[cfg.id].displayName}
                      onChange={(e) => setForm(cfg.id, { displayName: e.target.value })}
                      placeholder={t('form.displayNamePlaceholder')}
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`ch-bot-${cfg.id}`}>
                      {t('form.botName')}
                    </label>
                    <input
                      id={`ch-bot-${cfg.id}`}
                      className={styles.input}
                      value={forms[cfg.id].botUsername}
                      onChange={(e) => setForm(cfg.id, { botUsername: e.target.value })}
                      placeholder={t('form.botNamePlaceholder')}
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={`${styles.btnAdd} ${addBtnClass(cfg.theme)}`}
                      disabled={busy && busyPlatform === cfg.id}
                      onClick={() => void handleAdd(cfg)}
                    >
                      {busy && busyPlatform === cfg.id ? t('status.adding') : cfg.addLabel}
                    </button>
                  </div>
                  {actionError?.platform === cfg.id && (
                    <p className={styles.error}>{actionError.message}</p>
                  )}
                </div>

                <div className={styles.listSection}>
                  <h4 className={styles.listTitle}>{cfg.listTitle}</h4>
                  {rowsByPlatform.get(cfg.id)?.length === 0 ? (
                    <p className={styles.emptyList}>{cfg.emptyList}</p>
                  ) : (
                    rowsByPlatform.get(cfg.id)?.map((row) => (
                      <div key={row.id} className={styles.row}>
                        <div className={styles.rowMain}>
                          <p className={styles.rowName}>{row.channel_name}</p>
                          <p className={styles.rowMeta}>
                            id {row.channel_id ?? '—'} · {row.bot_username}
                            {row.is_active ? '' : ` · ${t('status.paused')}`}
                          </p>
                        </div>
                        <div className={styles.rowActions}>
                          <label className={styles.toggle}>
                            <input
                              type="checkbox"
                              checked={row.is_active}
                              disabled={rowBusy === row.id}
                              onChange={(e) => void toggleRow(row, e.target.checked)}
                            />
                            <span className={styles.toggleSlider} />
                          </label>
                          <button
                            type="button"
                            className={styles.btnRemove}
                            disabled={rowBusy === row.id}
                            onClick={() => void removeRow(row, cfg.removeLabel)}
                          >
                            {t('status.remove')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

export default IntegrationTab
