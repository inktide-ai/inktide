'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  { slug: 'discord',  name: 'Discord',  category: 'Chat',   isNative: true, available: true,  shortDescription: 'Route guild messages to your AI character in real-time.' },
  { slug: 'twitch',   name: 'Twitch',   category: 'Stream', isNative: true, available: true,  shortDescription: 'Let your character react to live chat and stream events.' },
  { slug: 'telegram', name: 'Telegram', category: 'Chat',   isNative: true, available: true,  shortDescription: 'Connect a Telegram bot to relay chat messages to your AI.' },
]

const COMING_SOON_CONNECTORS: StaticConnector[] = [
  { slug: 'youtube', name: 'YouTube', category: 'Stream', isNative: false, available: false, shortDescription: 'Connect live stream chat to drive AI responses.' },
  { slug: 'tiktok',  name: 'TikTok',  category: 'Stream', isNative: false, available: false, shortDescription: 'Engage your TikTok live audience with AI replies.' },
]

export function MarketplaceLandingPage() {
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="border-b border-[var(--border-subtle)] px-6 py-14 text-center">
        <div className="mx-auto max-w-[640px]">
          <h1 className="home-heading-font text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            Marketplace
          </h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
            Connect your AI soul to every platform and extend it with powerful plugins.
          </p>
          <div className="mt-7 flex items-center justify-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 transition-colors focus-within:border-[var(--accent-primary)]">
              <Search size={15} className="shrink-0 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search channels and plugins…"
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
              />
            </div>
            <a
              href="#channels"
              className="flex shrink-0 h-[46px] items-center gap-1.5 rounded-2xl bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse channels
              <ArrowRight size={14} />
            </a>
            <a
              href="#plugins"
              className="flex shrink-0 h-[46px] items-center gap-1.5 rounded-2xl border border-[var(--border-subtle)] px-4 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
            >
              Explore plugins
            </a>
          </div>
        </div>
      </section>

      {/* ── Banner ───────────────────────────────────────────────────── */}
      <section className="px-6 pt-10">
        <div className="mx-auto max-w-[1300px]">
          <div className="relative flex overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
            {/* Left column — fixed width, Notion-style layout */}
            <div className="flex w-[44%] shrink-0 flex-col justify-between px-8 py-8">
              <div>
                <div className="mb-3">
                  <span className="text-xs font-medium text-[var(--text-tertiary)]">AI Souls</span>
                </div>
                <h2 className="home-heading-font text-[1.375rem] font-bold leading-snug tracking-[-0.025em] text-[var(--text-primary)]">
                  Connect your Soul to the world
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                  Link your AI character to Twitch, Discord, Telegram and more — go live in minutes.
                </p>
              </div>
              <a
                href="#channels"
                className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] transition-opacity hover:opacity-60"
              >
                Explore <ArrowRight size={13} />
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

      {/* ── Channels ─────────────────────────────────────────────────── */}
      <section id="channels" className="px-6 py-12">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="home-heading-font text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                Channels
              </h2>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
                Connect your AI to where your audience already is.
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
              Browse channels
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
              Coming soon
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

      {/* ── Plugins ──────────────────────────────────────────────────── */}
      <section id="plugins" className="border-t border-[var(--border-subtle)] px-6 py-12">
        <div className="mx-auto max-w-[1300px]">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="home-heading-font text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
                  Plugins
                </h2>
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                  Coming soon
                </span>
              </div>
              <p className="mt-2 text-[1.0625rem] leading-relaxed text-[var(--text-secondary)]">
                Extend your AI soul with skills, tools, and third-party integrations.
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
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Overlay CTA */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[var(--bg-0)]/70 backdrop-blur-[1px]">
              <div className="text-center">
                <p className="text-base font-semibold text-[var(--text-primary)]">Plugin marketplace is in development</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  You'll be able to install plugins directly from your project settings.
                </p>
              </div>
              <a
                href="/projects"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Go to Projects
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ── Connector row ────────────────────────────────────────────────────── */

function ConnectorRow({
  connector,
  onInstall,
}: {
  connector: StaticConnector
  onInstall: (slug: string) => void
}) {
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
          {connector.shortDescription}
        </span>
        <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          {connector.isNative && <Zap size={11} />}
          <span>{connector.isNative ? 'Native' : connector.category}</span>
        </div>
      </div>

      {/* Right: free badge */}
      <span className="shrink-0 text-sm font-medium text-[var(--text-tertiary)]">
        Free
      </span>
    </button>
  )
}

const PLUGIN_PLACEHOLDERS = [
  { name: 'Memory Boost',       desc: 'Extended long-term memory with vector search' },
  { name: 'Web Search',         desc: 'Let your AI search the web in real time' },
  { name: 'Custom Commands',    desc: 'Define slash commands for your community' },
  { name: 'Analytics',          desc: 'Track engagement and response metrics' },
  { name: 'Moderation Shield',  desc: 'Automatic content moderation layer' },
  { name: 'Stream Alerts',      desc: 'Dynamic alerts with AI-generated messages' },
]
