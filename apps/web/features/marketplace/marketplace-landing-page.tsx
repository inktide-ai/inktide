'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Clock, Puzzle, Search, Zap } from 'lucide-react'
import { useCharactersContext } from '@/entities/character'
import { ICON_MAP, PLATFORM_COLORS } from './icons'

interface StaticConnector {
  slug: string
  name: string
  category: string
  shortDescription: string
  isNative: boolean
  available: boolean
}

const AVAILABLE_CONNECTORS: StaticConnector[] = [
  { slug: 'discord',  name: 'Discord',  category: 'Chat',   isNative: true, available: true,  shortDescription: 'marketplace.connectorDiscord' },
  { slug: 'twitch',   name: 'Twitch',   category: 'Stream', isNative: true, available: true,  shortDescription: 'marketplace.connectorTwitch'  },
  { slug: 'telegram', name: 'Telegram', category: 'Chat',   isNative: true, available: true,  shortDescription: 'marketplace.connectorTelegram' },
]

const COMING_SOON_CONNECTORS: StaticConnector[] = [
  { slug: 'youtube', name: 'YouTube', category: 'Stream', isNative: false, available: false, shortDescription: 'marketplace.connectorYouTube' },
  { slug: 'tiktok',  name: 'TikTok',  category: 'Stream', isNative: false, available: false, shortDescription: 'marketplace.connectorTikTok'  },
]

export function MarketplaceLandingPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { selected } = useCharactersContext()
  const [search, setSearch] = useState('')

  function handleInstall(slug: string) {
    const base = selected
      ? `/souls/${selected.id}/channels/marketplace`
      : '/souls'
    router.push(selected ? `${base}/${slug}` : base)
  }

  return (
    <div className="h-full overflow-y-auto">

      <section className="border-b border-[var(--border-subtle)] px-6 py-14 text-center">
        <div className="mx-auto max-w-[640px]">
          <h1 className="home-heading-font text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            {t('marketplace.title')}
          </h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
            {t('marketplace.subtitle')}
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 transition-colors focus-within:border-[var(--accent-primary)]">
              <Search size={15} className="shrink-0 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('marketplace.searchPlaceholder')}
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <a
              href="#channels"
              className="flex shrink-0 h-[46px] items-center gap-1.5 rounded-2xl bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('marketplace.browseChannels')}
              <ArrowRight size={14} />
            </a>
            <a
              href="#plugins"
              className="flex shrink-0 h-[46px] items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
            >
              {t('marketplace.explorePlugins')}
            </a>
          </div>
        </div>
      </section>

      <section className="px-6 pt-10">
        <div className="mx-auto max-w-[1300px]">
          <div className="relative flex overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
            {/* Left column — fixed width, Notion-style layout */}
            <div className="flex w-[44%] shrink-0 flex-col justify-between px-8 py-8">
              <div>
                <div className="mb-3">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">{t('marketplace.bannerLabel')}</span>
                </div>
                <h2 className="home-heading-font text-[1.375rem] font-bold leading-snug tracking-[-0.025em] text-[var(--text-primary)]">
                  {t('marketplace.bannerTitle')}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                  {t('marketplace.bannerDesc')}
                </p>
              </div>
              <a
                href="#channels"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-60"
              >
                {t('marketplace.bannerExplore')} <ArrowRight size={13} />
              </a>
            </div>

            {/* Right — illustration fills the space, bleeds out of top */}
            <div className="relative flex-1 overflow-hidden" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/souls-banner.png"
                alt=""
                className="absolute bottom-0 right-0 h-[125%] max-w-none w-auto object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="channels" className="px-6 py-12">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="home-heading-font text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                {t('marketplace.channelsTitle')}
              </h2>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
                {t('marketplace.channelsDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  selected
                    ? `/souls/${selected.id}/channels/marketplace`
                    : '/souls'
                )
              }
              className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] transition-opacity hover:opacity-70"
            >
              {t('marketplace.browseChannels')}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--text-primary)]">
                <ArrowRight size={13} className="text-[var(--bg-0)]" />
              </span>
            </button>
          </div>

          {/* Available connectors */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {AVAILABLE_CONNECTORS.map(c => (
              <ConnectorRow key={c.slug} connector={c} onInstall={handleInstall} />
            ))}
          </div>

          {/* Coming soon row */}
          <div className="mt-6">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
              {t('marketplace.comingSoon')}
            </p>
            <div className="flex flex-wrap gap-2">
              {COMING_SOON_CONNECTORS.map(c => {
                const Icon = ICON_MAP[c.slug]
                return (
                  <div
                    key={c.slug}
                    className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 opacity-60"
                  >
                    {Icon ? (
                      <span className="flex h-6 w-6 shrink-0 overflow-hidden rounded-full">
                        <Icon />
                      </span>
                    ) : null}
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{c.name}</span>
                    <Clock size={12} className="text-[var(--text-tertiary)]" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="plugins" className="border-t border-[var(--border-subtle)] px-6 py-12">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="home-heading-font text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                  {t('marketplace.pluginsTitle')}
                </h2>
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                  {t('marketplace.comingSoon')}
                </span>
              </div>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
                {t('marketplace.pluginsDesc')}
              </p>
            </div>
          </div>

          {/* Placeholder grid */}
          <div className="relative">
            <div className="pointer-events-none grid grid-cols-1 gap-4 select-none opacity-40 blur-[2px] sm:grid-cols-2 lg:grid-cols-3">
              {PLUGIN_PLACEHOLDERS.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                    <Puzzle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{p.nameKey}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{t(p.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[var(--bg-0)]/70 backdrop-blur-[1px]">
              <div className="text-center">
                <p className="text-base font-semibold text-[var(--text-primary)]">{t('marketplace.pluginDevMessage')}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {t('marketplace.pluginDevDesc')}
                </p>
              </div>
              <a
                href="/projects"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                {t('marketplace.goToProjects')}
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}


function ConnectorRow({
  connector,
  onInstall,
}: {
  connector: StaticConnector
  onInstall: (slug: string) => void
}) {
  const { t } = useTranslation('common')
  const Icon  = ICON_MAP[connector.slug]
  const color = PLATFORM_COLORS[connector.slug] ?? '#6b7280'

  return (
    <button
      type="button"
      onClick={() => onInstall(connector.slug)}
      className="flex w-full items-center gap-5 px-5 py-4 text-left transition-colors hover:bg-[var(--surface-1)]"
    >
      {/* 64×64 icon */}
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface-2)] [&_svg]:h-full [&_svg]:w-full">
        {Icon ? <Icon /> : (
          <div
            className="flex h-full w-full items-center justify-center text-lg font-bold text-white"
            style={{ background: color }}
          >
            {connector.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold text-[var(--text-primary)]">
          {connector.name}
        </span>
        <span className="line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {t(connector.shortDescription)}
        </span>
        <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          {connector.isNative && <Zap size={11} />}
          <span>{connector.isNative ? t('marketplace.connectorNative') : connector.category}</span>
        </div>
      </div>

      {/* Right: free badge */}
      <span className="shrink-0 text-sm font-medium text-[var(--text-tertiary)]">
        {t('marketplace.connectorFree')}
      </span>
    </button>
  )
}

const PLUGIN_PLACEHOLDERS = [
  { nameKey: 'Memory Boost',      descKey: 'marketplace.pluginMemoryBoost'      },
  { nameKey: 'Web Search',        descKey: 'marketplace.pluginWebSearch'         },
  { nameKey: 'Custom Commands',   descKey: 'marketplace.pluginCustomCommands'    },
  { nameKey: 'Analytics',         descKey: 'marketplace.pluginAnalytics'         },
  { nameKey: 'Moderation Shield', descKey: 'marketplace.pluginModerationShield'  },
  { nameKey: 'Stream Alerts',     descKey: 'marketplace.pluginStreamAlerts'      },
]
