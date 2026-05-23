'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock } from 'lucide-react'
import {
  getConnector,
  getSoulInstallations,
  installConnector,
  uninstallConnector,
  type ConnectorResponse,
  type InstallationResponse,
} from '@/api/marketplace'

/* ── platform icons ─────────────────────────────────────────────────── */

function IconDiscord() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="#5865F2"/>
      <path fill="#fff" fillRule="nonzero" d="M368.896 153.381a269.506 269.506 0 00-67.118-20.637 186.88 186.88 0 00-8.57 17.475 250.337 250.337 0 00-37.247-2.8c-12.447 0-24.955.946-37.25 2.776-2.511-5.927-5.427-11.804-8.592-17.454a271.73 271.73 0 00-67.133 20.681c-42.479 62.841-53.991 124.112-48.235 184.513a270.622 270.622 0 0082.308 41.312c6.637-8.959 12.582-18.497 17.63-28.423a173.808 173.808 0 01-27.772-13.253c2.328-1.688 4.605-3.427 6.805-5.117 25.726 12.083 53.836 18.385 82.277 18.385 28.442 0 56.551-6.302 82.279-18.387 2.226 1.817 4.503 3.557 6.805 5.117a175.002 175.002 0 01-27.823 13.289 197.847 197.847 0 0017.631 28.4 269.513 269.513 0 0082.363-41.305l-.007.007c6.754-70.045-11.538-130.753-48.351-184.579zM201.968 300.789c-16.04 0-29.292-14.557-29.292-32.465s12.791-32.592 29.241-32.592 29.599 14.684 29.318 32.592c-.282 17.908-12.919 32.465-29.267 32.465zm108.062 0c-16.066 0-29.267-14.557-29.267-32.465s12.791-32.592 29.267-32.592c16.475 0 29.522 14.684 29.241 32.592-.281 17.908-12.894 32.465-29.241 32.465z"/>
    </svg>
  )
}

function IconTwitch() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="#6441a4"/>
      <path d="m115 101-22 56v228h78v42h44l41-42h63l85-85v-199zm260 185-48 48h-78l-42 42v-42h-65v-204h233zm-48-100v85h-30v-85zm-78 0v85h-29v-85z" fill="#fff"/>
    </svg>
  )
}

function IconTelegram() {
  return (
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
}

function IconYouTube() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="#fff"/>
      <path d="M499.015 153.93a63.33 63.33 0 0 0-44.56-44.84C413.57 98 256 98 256 98s-157.57 0-198.455 11.09a63.33 63.33 0 0 0-44.56 44.84C2 195.05 2 256 2 256s0 60.95 10.985 102.07a63.33 63.33 0 0 0 44.56 44.84C98.43 414 256 414 256 414s157.57 0 198.455-11.09a63.33 63.33 0 0 0 44.56-44.84C510 313.95 510 256 510 256s0-60.95-10.985-102.07zM206 330V182l132 74z" fill="#FF0000"/>
    </svg>
  )
}

function IconTikTok() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="#000"/>
      <path d="M389.25 153.8a102.7 102.7 0 01-62.5-20.9V287c0 72.6-59 131.5-131.7 131.5S63.4 359.6 63.4 287s59-131.5 131.7-131.5c7.3 0 14.4.6 21.3 1.8v72.9a60.4 60.4 0 00-21.3-3.8 60.6 60.6 0 100 121.2 60.6 60.6 0 0060.6-60.6V93.5h71.2a102.8 102.8 0 0062.4 60.3z" fill="#fff"/>
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

export default function ConnectorDetailPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>()
  const router        = useRouter()

  const [connector,     setConnector]     = useState<ConnectorResponse | null>(null)
  const [installations, setInstallations] = useState<InstallationResponse[]>([])
  const [loading,       setLoading]       = useState(true)
  const [busy,          setBusy]          = useState(false)

  useEffect(() => {
    Promise.all([getConnector(slug), getSoulInstallations(id)])
      .then(([c, i]) => { setConnector(c); setInstallations(i) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, slug])

  const installation = installations.find(i => i.connector_slug === slug)
  const isInstalled  = !!installation

  async function handleInstall() {
    if (busy || !connector) return
    setBusy(true)
    try {
      const inst = await installConnector(id, slug)
      setInstallations(prev => [...prev, inst])
      router.push(`/souls/${id}/channels/${slug}`)
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  async function handleUninstall() {
    if (busy || !installation) return
    setBusy(true)
    try {
      await uninstallConnector(installation.id)
      setInstallations(prev => prev.filter(i => i.id !== installation.id))
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Loading…</div>
  }

  if (!connector) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">Connector not found.</div>
  }

  const Icon = ICON_MAP[connector.slug]

  return (
    <div className="mx-auto w-full max-w-[1248px] px-6" style={{ flex: '0 0 auto' }}>
      <div className="my-6 flex flex-1 flex-col min-w-0">
        <section className="flex flex-col gap-8">

          {/* back */}
          <button
            onClick={() => router.push(`/souls/${id}/channels/marketplace`)}
            className="flex items-center gap-2 text-[0.875rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit"
          >
            <ArrowLeft size={16} />
            Back to Marketplace
          </button>

          {/* detail card */}
          <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-xl border border-[var(--border-subtle)]">
            {/* icon */}
            <div className="relative w-14 h-14 rounded-full flex overflow-hidden shrink-0" aria-hidden>
              {Icon ? <Icon /> : null}
              <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
            </div>

            <div className="flex flex-col gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-[1.5rem] font-semibold text-[var(--text-heading)]">
                    {connector.name}
                  </h1>
                  <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] px-2.5 py-0.5 text-[0.75rem] font-medium text-[var(--text-tertiary)]">
                    {connector.category}
                  </span>
                  {isInstalled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-[0.75rem] font-medium text-green-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
                      Installed
                    </span>
                  )}
                </div>
                <p className="text-[0.9375rem] text-[var(--text-secondary)]">{connector.description}</p>
              </div>

              <div className="flex gap-3 flex-wrap">
                {connector.is_available ? (
                  isInstalled ? (
                    <>
                      <button
                        onClick={() => router.push(`/souls/${id}/channels/${slug}`)}
                        className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-[0.875rem] font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90"
                      >
                        Configure
                      </button>
                      <button
                        onClick={handleUninstall}
                        disabled={busy}
                        className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--border-subtle)] px-5 text-[0.875rem] font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {busy ? 'Removing…' : 'Uninstall'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleInstall}
                      disabled={busy}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-[0.875rem] font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busy ? 'Installing…' : 'Install'}
                    </button>
                  )
                ) : (
                  <span className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-[var(--text-tertiary)]">
                    <Clock size={15} />
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          </div>

        </section>
      </div>
    </div>
  )
}
