'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trans, useTranslation } from 'react-i18next'
import { ExternalLink, HelpCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getCard, type ChannelPlatform } from '@/features/soul/api/index'
import { queryKeys } from '@/shared/lib/query/keys'
import {
  CHANNEL_STATIC,
  CHANNEL_VALID_IDS,
  CHANNEL_DETAILS,
  type ChannelStaticConfig,
} from '@/shared/data/channel-platforms'
import { resolveOAuthReturn, oauthPendingKey } from './resolve-oauth-return'
import { DiscordChannelManager }  from './discord-channel-manager'
import { TelegramChannelManager } from './telegram-channel-manager'
import { TwitchChannelManager }   from './twitch-channel-manager'
import { GenericChannelForm }     from './generic-channel-form'

type PanelTheme = ChannelStaticConfig['theme']

function isActiveChannel(id: string): id is ChannelPlatform {
  return CHANNEL_VALID_IDS.includes(id)
}

function PlatformIcon({ theme }: { theme: PanelTheme }) {
  if (theme === 'discord') return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="var(--platform-discord)"/>
      <path fill="#fff" fillRule="nonzero" d="M368.896 153.381a269.506 269.506 0 00-67.118-20.637 186.88 186.88 0 00-8.57 17.475 250.337 250.337 0 00-37.247-2.8c-12.447 0-24.955.946-37.25 2.776-2.511-5.927-5.427-11.804-8.592-17.454a271.73 271.73 0 00-67.133 20.681c-42.479 62.841-53.991 124.112-48.235 184.513a270.622 270.622 0 0082.308 41.312c6.637-8.959 12.582-18.497 17.63-28.423a173.808 173.808 0 01-27.772-13.253c2.328-1.688 4.605-3.427 6.805-5.117 25.726 12.083 53.836 18.385 82.277 18.385 28.442 0 56.551-6.302 82.279-18.387 2.226 1.817 4.503 3.557 6.805 5.117a175.002 175.002 0 01-27.823 13.289 197.847 197.847 0 0017.631 28.4 269.513 269.513 0 0082.363-41.305l-.007.007c6.754-70.045-11.538-130.753-48.351-184.579zM201.968 300.789c-16.04 0-29.292-14.557-29.292-32.465s12.791-32.592 29.241-32.592 29.599 14.684 29.318 32.592c-.282 17.908-12.919 32.465-29.267 32.465zm108.062 0c-16.066 0-29.267-14.557-29.267-32.465s12.791-32.592 29.267-32.592c16.475 0 29.522 14.684 29.241 32.592-.281 17.908-12.894 32.465-29.241 32.465z"/>
    </svg>
  )
  if (theme === 'telegram') return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" aria-hidden width="56" height="56">
      <defs>
        <linearGradient id="tg-detail-grad" x1="120" y1="240" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d93d2"/>
          <stop offset="1" stopColor="#38b0e3"/>
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#tg-detail-grad)"/>
      <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
      <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
      <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
    </svg>
  )
  if (theme === 'twitch') return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="#6441a4"/>
      <path d="m115 101-22 56v228h78v42h44l41-42h63l85-85v-199zm260 185-48 48h-78l-42 42v-42h-65v-204h233zm-48-100v85h-30v-85zm-78 0v85h-29v-85z" fill="#fff"/>
    </svg>
  )
  if (theme === 'kick') return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="#53fc18"/>
      <path fill="#000" d="M96 96h128v106l96-106h128L320 256l128 160H320L224 310v106H96z"/>
    </svg>
  )
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="var(--platform-vk)"/>
      <path fill="#fff" d="M380 170H336c-14 0-18 7-18 14 0 38 18 88 72 120-28 4-56 6-84 4-78-10-104-52-106-100-2-38 18-72 52-90 30-16 66-18 96-6 18 6 32 18 44 32 4 4 6 10 4 16l-16 10zm-124 160c30 0 62-4 92-12l8 22c-30 10-62 16-100 16-78 0-126-34-144-90l20-6c14 46 56 70 124 70z"/>
    </svg>
  )
}

export default function ChannelConnectorPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const soulId       = params.id as string
  const connectorId  = (params.connector_id as string).toLowerCase()
  const { t } = useTranslation('channels')

  // Guard against invalid connectorId — avoids unsafe type cast in sub-components
  if (!isActiveChannel(connectorId)) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-[1200px]">
          <Link
            href={`/souls/${soulId}/channels`}
            className="inline-flex items-center gap-1.5 text-body text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 18l-6-6 6-6"/></svg>
            {t('connector.backToChannels')}
          </Link>
          <p className="text-body text-[var(--text-secondary)]">{t('connector.notAvailable')}</p>
        </div>
      </div>
    )
  }

  const sc = CHANNEL_STATIC[connectorId]

  // TECH DEBT: getCard fetches the entire card; channels are a sub-field.
  // A dedicated GET /api/cards/{id}/channels endpoint would reduce payload.
  const { data: allChannels = [], isError } = useQuery({
    queryKey: queryKeys.souls.channels(soulId),
    queryFn: () => getCard(soulId).then(c => c.channels ?? []),
  })

  const platformChannels = useMemo(
    () => allChannels.filter(c => c.platform.toLowerCase() === connectorId),
    [allChannels, connectorId],
  )

  // Evaluated once per mount via useState lazy init — no side effects in render phase.
  const [justConnected] = useState(() =>
    resolveOAuthReturn(searchParams, soulId, connectorId),
  )

  // Idempotent cleanup after genuine OAuth return (Strict Mode safe — removeItem is idempotent).
  useEffect(() => {
    if (justConnected) {
      sessionStorage.removeItem(oauthPendingKey(connectorId, soulId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional one-shot cleanup
  }, [])

  const details    = CHANNEL_DETAILS[connectorId]
  const detailRows = details ? [
    { label: t('connector.developer'),     node: <span className="text-[var(--text-primary)] text-body">{details.developer}</span> },
    { label: t('connector.website'),       node: <a href={`https://${details.website}`} target="_blank" rel="noreferrer" className="text-body text-[var(--accent-primary)] hover:underline">{details.website}</a> },
    { label: t('connector.documentation'), node: <a href={details.docsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-body text-[var(--accent-primary)] hover:underline">{t('connector.read')} <ExternalLink size={11} /></a> },
    { label: t('connector.terms'),         node: <a href={details.termsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-body text-[var(--accent-primary)] hover:underline">{t('connector.read')} <ExternalLink size={11} /></a> },
    { label: t('connector.privacy'),       node: <a href={details.privacyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-body text-[var(--accent-primary)] hover:underline">{t('connector.read')} <ExternalLink size={11} /></a> },
    { label: t('connector.support'),       node: <a href={details.supportUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-body text-[var(--accent-primary)] hover:underline">{t('connector.openIn')} {t(`${connectorId}.title`)} <ExternalLink size={11} /></a> },
  ] : []

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-[1200px]">

        <nav className="mb-6 flex items-center gap-2 text-body text-[var(--text-secondary)]">
          <Link href={`/souls/${soulId}/channels`} className="hover:text-[var(--text-primary)] transition-colors">
            {t('connector.myIntegrations')}
          </Link>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)] capitalize">{t(`${connectorId}.title`)}</span>
          <span className="text-[var(--text-tertiary)]">/</span>
          <span className="text-[var(--text-primary)]">{t('connector.installation')}</span>
        </nav>

        <div className="flex items-start justify-between pb-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full flex overflow-hidden shrink-0">
              <PlatformIcon theme={sc.theme} />
              <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
            </div>
            <div>
              <h1 className="text-[22px] font-semibold leading-tight text-[var(--text-primary)]">
                {t(`${connectorId}.title`)}
              </h1>
              <p className="mt-1 text-body text-[var(--text-secondary)] max-w-md">
                {t(`${connectorId}.subtitle`)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3.5 py-2 text-body font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <HelpCircle size={14} className="text-[var(--text-secondary)]" />
              {t(`${connectorId}.title`)} {t('connector.support')}
            </button>
            {details && (
              <a
                href={details.supportUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--text-primary)] px-3.5 py-2 text-body font-medium text-[var(--bg-0)] hover:opacity-90 transition-opacity"
              >
                {t('connector.openIn')} {t(`${connectorId}.title`)}
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-8 grid grid-cols-[1fr_300px] gap-8 items-start"
        >
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-[20px] font-semibold text-[var(--text-primary)]">{t('connector.settings')}</h2>
              <p className="mt-1 text-body text-[var(--text-secondary)]">{t('connector.editSettings')}</p>
            </div>

            <div className="rounded-xl p-4 text-body leading-relaxed bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] [&_code]:font-mono [&_code]:text-body [&_code]:bg-[var(--surface-2)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_a]:text-[var(--accent-primary)] [&_a]:no-underline [&_a:hover]:underline">
              <Trans
                i18nKey={`${connectorId}.hint`}
                ns="channels"
                components={{
                  strong: <strong />,
                  code: <code />,
                  a: sc.hintLink
                    ? <a href={sc.hintLink} target="_blank" rel="noreferrer" />
                    : <span />,
                }}
              />
            </div>

            {isError && (
              <p className="text-body text-red-400">{t('error.load')}</p>
            )}

            {justConnected && (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-body text-green-400">
                {connectorId === 'discord'
                  ? t('connector.successDiscord')
                  : connectorId === 'twitch'
                  ? t('connector.successTwitch')
                  : t('connector.success')}
              </div>
            )}

            {connectorId === 'discord' && (
              <DiscordChannelManager soulId={soulId} channels={platformChannels} />
            )}
            {connectorId === 'telegram' && (
              <TelegramChannelManager soulId={soulId} channels={platformChannels} />
            )}
            {connectorId === 'twitch' && (
              <TwitchChannelManager soulId={soulId} channels={platformChannels} />
            )}
            {connectorId !== 'discord' && connectorId !== 'telegram' && connectorId !== 'twitch' && (
              <GenericChannelForm
                soulId={soulId}
                connectorId={connectorId}
                channels={platformChannels}
              />
            )}
          </div>

          <aside className="sticky top-6">
            <h3 className="text-[20px] font-semibold text-[var(--text-primary)] mb-4">{t('connector.details')}</h3>
            <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden">
              {detailRows.map((row, i) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-4 py-3${i < detailRows.length - 1 ? ' border-b border-[var(--border-subtle)]' : ''}`}
                >
                  <span className="text-body text-[var(--text-secondary)]">{row.label}</span>
                  {row.node}
                </div>
              ))}
            </div>
          </aside>
        </motion.div>
      </div>
    </div>
  )
}
