'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Clock } from 'lucide-react'
import {
  getConnectors,
  getSoulInstallations,
  installConnector,
  type ConnectorResponse,
  type InstallationResponse,
} from '@/api/marketplace'

/* ── platform icons ─────────────────────────────────────────────────── */

function IconDiscord() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="36" height="36">
      <rect width="512" height="512" fill="var(--platform-discord)"/>
      <path fill="#fff" fillRule="nonzero" d="M368.896 153.381a269.506 269.506 0 00-67.118-20.637 186.88 186.88 0 00-8.57 17.475 250.337 250.337 0 00-37.247-2.8c-12.447 0-24.955.946-37.25 2.776-2.511-5.927-5.427-11.804-8.592-17.454a271.73 271.73 0 00-67.133 20.681c-42.479 62.841-53.991 124.112-48.235 184.513a270.622 270.622 0 0082.308 41.312c6.637-8.959 12.582-18.497 17.63-28.423a173.808 173.808 0 01-27.772-13.253c2.328-1.688 4.605-3.427 6.805-5.117 25.726 12.083 53.836 18.385 82.277 18.385 28.442 0 56.551-6.302 82.279-18.387 2.226 1.817 4.503 3.557 6.805 5.117a175.002 175.002 0 01-27.823 13.289 197.847 197.847 0 0017.631 28.4 269.513 269.513 0 0082.363-41.305l-.007.007c6.754-70.045-11.538-130.753-48.351-184.579zM201.968 300.789c-16.04 0-29.292-14.557-29.292-32.465s12.791-32.592 29.241-32.592 29.599 14.684 29.318 32.592c-.282 17.908-12.919 32.465-29.267 32.465zm108.062 0c-16.066 0-29.267-14.557-29.267-32.465s12.791-32.592 29.267-32.592c16.475 0 29.522 14.684 29.241 32.592-.281 17.908-12.894 32.465-29.241 32.465z"/>
    </svg>
  )
}

function IconTwitch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="36" height="36">
      <rect width="512" height="512" fill="#6441a4"/>
      <path d="m115 101-22 56v228h78v42h44l41-42h63l85-85v-199zm260 185-48 48h-78l-42 42v-42h-65v-204h233zm-48-100v85h-30v-85zm-78 0v85h-29v-85z" fill="#fff"/>
    </svg>
  )
}

function IconTelegram() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" aria-hidden width="36" height="36">
      <defs>
        <linearGradient id="tg-mp-grad" x1="120" y1="240" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d93d2"/>
          <stop offset="1" stopColor="#38b0e3"/>
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#tg-mp-grad)"/>
      <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
      <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
      <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
    </svg>
  )
}

function IconYouTube() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="36" height="36">
      <rect width="512" height="512" fill="#fff"/>
      <path d="M499.015 153.93a63.33 63.33 0 0 0-44.56-44.84C413.57 98 256 98 256 98s-157.57 0-198.455 11.09a63.33 63.33 0 0 0-44.56 44.84C2 195.05 2 256 2 256s0 60.95 10.985 102.07a63.33 63.33 0 0 0 44.56 44.84C98.43 414 256 414 256 414s157.57 0 198.455-11.09a63.33 63.33 0 0 0 44.56-44.84C510 313.95 510 256 510 256s0-60.95-10.985-102.07zM206 330V182l132 74z" fill="#FF0000"/>
    </svg>
  )
}

function IconTikTok() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="36" height="36">
      <rect width="512" height="512" fill="#000"/>
      <path d="M389.25 153.8a102.7 102.7 0 01-62.5-20.9V287c0 72.6-59 131.5-131.7 131.5S63.4 359.6 63.4 287s59-131.5 131.7-131.5c7.3 0 14.4.6 21.3 1.8v72.9a60.4 60.4 0 00-21.3-3.8 60.6 60.6 0 100 121.2 60.6 60.6 0 0060.6-60.6V93.5h71.2a102.8 102.8 0 0062.4 60.3z" fill="#fff"/>
      <path d="M389.25 153.8a102.7 102.7 0 01-62.5-20.9V287c0 72.6-59 131.5-131.7 131.5S63.4 359.6 63.4 287s59-131.5 131.7-131.5c7.3 0 14.4.6 21.3 1.8v72.9a60.4 60.4 0 00-21.3-3.8 60.6 60.6 0 100 121.2 60.6 60.6 0 0060.6-60.6V93.5h71.2a102.8 102.8 0 0062.4 60.3z" fill="#EE1D52" opacity="0.5"/>
    </svg>
  )
}

const ICON_MAP: Record<string, () => React.JSX.Element> = {
  discord:  IconDiscord,
  twitch:   IconTwitch,
  telegram: IconTelegram,
  youtube:  IconYouTube,
  tiktok:   IconTikTok,
}

/* ── page ────────────────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()

  const [connectors,     setConnectors]     = useState<ConnectorResponse[]>([])
  const [installations,  setInstallations]  = useState<InstallationResponse[]>([])
  const [loading,        setLoading]        = useState(true)
  const [installing,     setInstalling]     = useState<string | null>(null)
  const [search,         setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => {
    Promise.all([getConnectors(), getSoulInstallations(id)])
      .then(([c, i]) => { setConnectors(c); setInstallations(i) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const installedSlugs = useMemo(
    () => new Set(installations.map(i => i.connector_slug)),
    [installations],
  )

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(connectors.map(c => c.category)))],
    [connectors],
  )

  const visible = useMemo(() => {
    const q = search.toLowerCase()
    return connectors.filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      const matchCat = categoryFilter === 'All' || c.category === categoryFilter
      return matchQ && matchCat
    })
  }, [connectors, search, categoryFilter])

  async function handleInstall(slug: string) {
    if (installing) return
    setInstalling(slug)
    try {
      const installation = await installConnector(id, slug)
      setInstallations(prev => [...prev, installation])
    } catch (e) {
      console.error(e)
    } finally {
      setInstalling(null)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading…</div>
  }

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6 flex-none">
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
              const Icon        = ICON_MAP[connector.slug]
              const isInstalled = installedSlugs.has(connector.slug)
              const isBusy      = installing === connector.slug

              return (
                <div
                  key={connector.id}
                  className="relative flex flex-col gap-4 rounded-xl border border-[var(--border-subtle)] p-5 transition-colors hover:bg-[var(--surface-1)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* icon */}
                    <div className="relative w-11 h-11 rounded-full flex overflow-hidden shrink-0" aria-hidden>
                      {Icon ? <Icon /> : null}
                      <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
                    </div>

                    {/* badge */}
                    <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-caption font-medium text-[var(--text-tertiary)] shrink-0">
                      {connector.category}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 flex-1">
                    <p className="text-body-md font-semibold text-[var(--text-heading)]">{connector.name}</p>
                    <p className="text-sm text-[var(--text-secondary)] leading-snug">{connector.description}</p>
                  </div>

                  {connector.is_available ? (
                    isInstalled ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-500">
                        <Check size={14} />
                        Installed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleInstall(connector.slug)}
                        disabled={!!installing}
                        className="inline-flex h-8 items-center justify-center rounded-md bg-[var(--text-primary)] px-4 text-sm font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBusy ? 'Installing…' : 'Install'}
                      </button>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-tertiary)]">
                      <Clock size={14} />
                      Coming soon
                    </span>
                  )}
                </div>
              )
            })}
          </div>

        </section>
      </div>
    </div>
  )
}
