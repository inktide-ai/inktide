'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Clock, ExternalLink, Globe, Shield, Tag, Zap } from 'lucide-react'
import {
  getConnector,
  getSoulInstallations,
  type ConnectorResponse,
  type InstallationResponse,
} from '@/features/soul/channels/api/marketplace'
import { getCard } from '@/entities/soul/api/cards'
import type { ChannelResponse } from '@/shared/types/soul-api'

/* ── platform icons ─────────────────────────────────────────────────── */

function IconDiscord() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="56" height="56">
      <rect width="512" height="512" fill="var(--platform-discord)"/>
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

const AUTH_TYPE_LABELS: Record<string, string> = {
  oauth:   'OAuth 2.0',
  apikey:  'API Key',
  webhook: 'Webhook',
  none:    'No auth required',
}

/* ── page ────────────────────────────────────────────────────────────── */

export default function ConnectorDetailPage() {
  const { id, slug } = useParams<{ id: string; slug: string }>()
  const router        = useRouter()

  const [connector,     setConnector]     = useState<ConnectorResponse | null>(null)
  const [installations, setInstallations] = useState<InstallationResponse[]>([])
  const [soulChannels,  setSoulChannels]  = useState<ChannelResponse[]>([])
  const [loading,       setLoading]       = useState(true)

  const searchParams = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search)
    : null
  const justInstalled = searchParams?.get('installed') === 'true'

  useEffect(() => {
    Promise.all([
      getConnector(slug),
      getSoulInstallations(id).catch(() => [] as InstallationResponse[]),
      getCard(id).then(card => card.channels ?? []).catch(() => [] as ChannelResponse[]),
    ])
      .then(([c, i, ch]) => { setConnector(c); setInstallations(i); setSoulChannels(ch) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id, slug])

  const isInstalled = connector?.isNative
    ? soulChannels.some(ch => ch.platform === slug)
    : installations.some(i => i.connectorSlug === slug)

  function handleAddIntegration() {
    if (!connector?.isAvailable) return
    // native connectors: navigate to their dedicated setup page
    if (connector.isNative) {
      router.push(`/souls/${id}/channels/${slug}`)
      return
    }
    // third-party with linked application: launch Keycloak OAuth flow
    if (connector.applicationId) {
      const params = new URLSearchParams({
        client_id:     connector.applicationId,
        redirect_uri:  `${window.location.origin}/souls/${id}/channels/marketplace/${slug}?installed=true`,
        response_type: 'code',
        scope:         'openid',
        state:         crypto.randomUUID(),
      })
      window.location.href = `/oauth/authorize?${params}`
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
    <div className="mx-auto w-full max-w-[1248px] px-6 flex-none">
      <div className="my-6 flex flex-1 flex-col min-w-0 gap-6">

        {/* back */}
        <button
          onClick={() => router.push(`/souls/${id}/channels/marketplace`)}
          className="flex items-center gap-2 text-body text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          Back to Marketplace
        </button>

        {/* main layout: content + sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* left: main content */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Success banner after OAuth redirect */}
            {justInstalled && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 flex items-center gap-2 text-sm text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                Successfully connected! You can now configure the integration below.
              </div>
            )}

            {/* hero card */}
            <div className="flex flex-col sm:flex-row gap-5 p-6 rounded-xl border border-[var(--border-subtle)]">
              {/* icon */}
              <div className="relative w-14 h-14 rounded-full flex overflow-hidden shrink-0" aria-hidden>
                {Icon ? <Icon /> : (
                  <div className="w-full h-full bg-[var(--surface-2)] flex items-center justify-center text-xl font-bold text-[var(--text-tertiary)]">
                    {connector.name.charAt(0)}
                  </div>
                )}
                <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
              </div>

              <div className="flex flex-col gap-3 flex-1 min-w-0">
                {/* name + badges */}
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex flex-col gap-0.5">
                    <h1 className="text-[1.5rem] font-semibold text-[var(--text-heading)] leading-tight">
                      {connector.name}
                    </h1>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      by {connector.authorName ?? 'Inktide'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {connector.isNative && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                        <Zap size={10} />
                        Native
                      </span>
                    )}
                    {isInstalled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
                        Connected
                      </span>
                    )}
                  </div>
                </div>

                {/* description */}
                <p className="text-body text-[var(--text-secondary)]">{connector.description}</p>

                {/* actions */}
                <div className="flex gap-3 flex-wrap">
                  {!connector.isAvailable ? (
                    <span className="inline-flex items-center gap-2 text-body font-medium text-[var(--text-tertiary)]">
                      <Clock size={15} />
                      Coming soon
                    </span>
                  ) : isInstalled ? (
                    <button
                      onClick={() => router.push(`/souls/${id}/channels/${slug}`)}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-body font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90"
                    >
                      Configure
                    </button>
                  ) : (
                    <button
                      onClick={handleAddIntegration}
                      className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--text-primary)] px-5 text-body font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90"
                    >
                      Add Integration
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* what this connector does */}
            {connector.isAvailable && (
              <div className="flex flex-col gap-3 p-6 rounded-xl border border-[var(--border-subtle)]">
                <h2 className="text-body-md font-semibold text-[var(--text-heading)]">
                  What this connector can do
                </h2>
                <ul className="flex flex-col gap-2">
                  <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                    Receive messages from {connector.name} and route them to your AI character
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                    Send AI-generated responses back to {connector.name} in real-time
                  </li>
                  {connector.isNative && (
                    <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <Check size={14} className="mt-0.5 shrink-0 text-green-500" />
                      First-party integration — maintained by Inktide
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* right: sidebar */}
          <aside className="lg:w-64 shrink-0 flex flex-col gap-4">

            <div className="rounded-xl border border-[var(--border-subtle)] p-4 flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">Details</h3>

              <dl className="flex flex-col gap-3">
                {/* category */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <Tag size={12} />
                    Category
                  </dt>
                  <dd className="text-xs text-[var(--text-primary)] font-medium">{connector.category}</dd>
                </div>

                {/* type */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <Zap size={12} />
                    Type
                  </dt>
                  <dd className="text-xs text-[var(--text-primary)] font-medium">
                    {connector.isNative ? 'Native' : 'Third-party'}
                  </dd>
                </div>

                {/* auth type */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <Shield size={12} />
                    Auth
                  </dt>
                  <dd className="text-xs text-[var(--text-primary)] font-medium">
                    {AUTH_TYPE_LABELS[connector.authType ?? 'none'] ?? connector.authType}
                  </dd>
                </div>

                {/* author */}
                <div className="flex items-center justify-between gap-2">
                  <dt className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                    <Globe size={12} />
                    Developer
                  </dt>
                  <dd className="text-xs text-[var(--text-primary)] font-medium">
                    {connector.authorName ?? 'Inktide'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* resources */}
            <div className="rounded-xl border border-[var(--border-subtle)] p-4 flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">Resources</h3>
              <div className="flex flex-col gap-2">
                {connector.websiteUrl && (
                  <a
                    href={connector.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <ExternalLink size={12} />
                    Website
                  </a>
                )}
                {!connector.websiteUrl && (
                  <span className="text-xs text-[var(--text-tertiary)]">No external resources</span>
                )}
              </div>
            </div>

          </aside>
        </div>

      </div>
    </div>
  )
}
