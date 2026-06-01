'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Clock, Zap } from 'lucide-react'
import {
  getConnectors,
  getSoulInstallations,
  type ConnectorResponse,
  type InstallationResponse,
} from '@/features/soul/channels/api/marketplace'
import { getCard } from '@/entities/soul/api/cards'
import type { ChannelResponse } from '@/shared/types/soul-api'

import { ICON_MAP } from '@/features/marketplace/icons'

/* ── page ────────────────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [connectors,     setConnectors]     = useState<ConnectorResponse[]>([])
  const [installations,  setInstallations]  = useState<InstallationResponse[]>([])
  const [soulChannels,   setSoulChannels]   = useState<ChannelResponse[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    Promise.all([
      getConnectors(),
      getSoulInstallations(id).catch(() => [] as InstallationResponse[]),
      getCard(id).then(card => card.channels ?? []).catch(() => [] as ChannelResponse[]),
    ])
      .then(([c, i, ch]) => { setConnectors(c); setInstallations(i); setSoulChannels(ch) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  // third-party installs tracked via ConnectorInstallation
  const thirdPartyInstalledSlugs = useMemo(
    () => new Set(installations.map(i => i.connectorSlug)),
    [installations],
  )

  // native installs derived from soul AiCardChannel records
  const nativeInstalledPlatforms = useMemo(
    () => new Set(soulChannels.map(ch => ch.platform)),
    [soulChannels],
  )

  function isInstalled(connector: ConnectorResponse): boolean {
    return connector.isNative
      ? nativeInstalledPlatforms.has(connector.slug)
      : thirdPartyInstalledSlugs.has(connector.slug)
  }

  function handleAction(connector: ConnectorResponse) {
    // native connectors always route to their dedicated setup page
    if (connector.isNative) {
      router.push(`/souls/${id}/channels/${connector.slug}`)
      return
    }
    // third-party: future OAuth/APIKey install flow
  }

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(connectors.map(c => c.category)))],
    [connectors],
  )

  const visible = useMemo(() => {
    const q = search.toLowerCase()
    return connectors
      .filter(c => {
        const matchQ   = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
        const matchCat = categoryFilter === 'All' || c.category === categoryFilter
        return matchQ && matchCat
      })
      .sort((a, b) => {
        // native first, then by sortOrder
        if (a.isNative && !b.isNative) return -1
        if (!a.isNative && b.isNative) return 1
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
      })
  }, [connectors, search, categoryFilter])

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading…</div>
  }

  return (
    <div className="mx-auto w-full max-w-[1300px] px-6 flex-none">
      <div className="my-6 flex flex-1 flex-col min-w-0">
        <section className="flex flex-col gap-6">

          {/* header */}
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-1)] transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">
                  Browse Marketplace
                </h2>
              </div>
              <span className="text-body text-[var(--text-secondary)] pl-9">
                Discover and install connectors for your AI character.
              </span>
            </div>
          </div>

          {/* search + category filter */}
          <div className="flex flex-col md:flex-row items-stretch gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none"
                viewBox="0 0 16 16" fill="currentColor"
              >
                <path fillRule="evenodd" clipRule="evenodd" d="M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0Z" />
              </svg>
              <input
                type="search"
                placeholder="Search connectors…"
                aria-label="Search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-sm border border-[var(--border-subtle)] rounded-lg bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-subtle)]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`h-9 px-3 text-sm rounded-lg border transition-colors ${
                    categoryFilter === cat
                      ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-0)]'
                      : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-1)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* connector grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(connector => {
              const Icon      = ICON_MAP[connector.slug]
              const installed = isInstalled(connector)

              return (
                <div
                  key={connector.id}
                  className="relative flex flex-col gap-4 rounded-xl border border-[var(--border-subtle)] p-5 transition-colors hover:bg-[var(--surface-1)] cursor-pointer"
                  onClick={() => router.push(`/souls/${id}/channels/marketplace/${connector.slug}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* icon */}
                    <div className="relative w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0" aria-hidden>
                      {Icon ? <Icon /> : (
                        <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)]">
                          {connector.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
                    </div>

                    {/* badges */}
                    <div className="flex items-center gap-1.5 mt-0.5 shrink-0 flex-wrap justify-end">
                      {connector.isNative && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-caption font-medium text-blue-400">
                          <Zap size={10} />
                          Native
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-caption font-medium text-[var(--text-tertiary)]">
                        {connector.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-body-md font-semibold text-[var(--text-heading)]">{connector.name}</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-snug">
                      {connector.shortDescription || connector.description}
                    </p>
                  </div>

                  {/* action */}
                  <div onClick={e => e.stopPropagation()}>
                    {!connector.isAvailable ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)]">
                        <Clock size={14} />
                        Coming soon
                      </span>
                    ) : installed ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500">
                        <Check size={14} />
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAction(connector)}
                        className="inline-flex h-8 items-center justify-center rounded-md bg-[var(--text-primary)] px-4 text-sm font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90"
                      >
                        Add Integration
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </section>
      </div>
    </div>
  )
}
