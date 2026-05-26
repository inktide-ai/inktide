'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'next/navigation'
import {
  getCard,
  type ChannelResponse,
} from '@/features/soul/api/index'
import { ApiError } from '../../../api/client'
import type { AiCharacter } from '@/shared/lib/character'

interface ChannelTabProps {
  character: AiCharacter
  onUpdate?: (patch: Partial<AiCharacter>) => void
}

interface PlatformConfig {
  id: string
  title: string
  category: string
  subtitle: string
  Icon: () => React.JSX.Element
}

function IconDiscord() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="36" height="36">
      <rect width="512" height="512" fill="#5865F2"/>
      <path fill="#fff" fillRule="nonzero" d="M368.896 153.381a269.506 269.506 0 00-67.118-20.637 186.88 186.88 0 00-8.57 17.475 250.337 250.337 0 00-37.247-2.8c-12.447 0-24.955.946-37.25 2.776-2.511-5.927-5.427-11.804-8.592-17.454a271.73 271.73 0 00-67.133 20.681c-42.479 62.841-53.991 124.112-48.235 184.513a270.622 270.622 0 0082.308 41.312c6.637-8.959 12.582-18.497 17.63-28.423a173.808 173.808 0 01-27.772-13.253c2.328-1.688 4.605-3.427 6.805-5.117 25.726 12.083 53.836 18.385 82.277 18.385 28.442 0 56.551-6.302 82.279-18.387 2.226 1.817 4.503 3.557 6.805 5.117a175.002 175.002 0 01-27.823 13.289 197.847 197.847 0 0017.631 28.4 269.513 269.513 0 0082.363-41.305l-.007.007c6.754-70.045-11.538-130.753-48.351-184.579zM201.968 300.789c-16.04 0-29.292-14.557-29.292-32.465s12.791-32.592 29.241-32.592 29.599 14.684 29.318 32.592c-.282 17.908-12.919 32.465-29.267 32.465zm108.062 0c-16.066 0-29.267-14.557-29.267-32.465s12.791-32.592 29.267-32.592c16.475 0 29.522 14.684 29.241 32.592-.281 17.908-12.894 32.465-29.241 32.465z"/>
    </svg>
  )
}

function IconTelegram() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" aria-hidden width="36" height="36">
      <defs>
        <linearGradient id="tg-grad" x1="120" y1="240" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d93d2"/>
          <stop offset="1" stopColor="#38b0e3"/>
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#tg-grad)"/>
      <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
      <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
      <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
    </svg>
  )
}

const ChannelTab = ({ character }: ChannelTabProps) => {
  const { t } = useTranslation('channels')
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const PLATFORM_CONFIG = useMemo((): PlatformConfig[] => [
    { id: 'discord',  category: 'Chat', title: t('discord.title'), subtitle: t('discord.subtitle'), Icon: IconDiscord  },
    { id: 'telegram', category: 'Chat', title: 'Telegram',          subtitle: 'Telegram Bot',        Icon: IconTelegram },
  ], [t])

  const [channels, setChannels] = useState<ChannelResponse[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoadError(null)
    try {
      const card = await getCard(character.id)
      setChannels(card.channels ?? [])
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : t('error.load'))
      setChannels([])
    }
  }, [character.id, t])

  useEffect(() => { void refresh() }, [refresh])

  const rowsByPlatform = useMemo(() => {
    const map = new Map<string, ChannelResponse[]>()
    for (const p of PLATFORM_CONFIG) {
      map.set(p.id, (channels ?? []).filter((c) => c.platform.toLowerCase() === p.id))
    }
    return map
  }, [channels, PLATFORM_CONFIG])

  const categories = useMemo(
    () => Array.from(new Set(PLATFORM_CONFIG.map(p => p.category))),
    [PLATFORM_CONFIG],
  )

  const visible = useMemo(() => {
    const q = search.toLowerCase()
    return PLATFORM_CONFIG.filter(cfg => {
      const matchQ = !q || cfg.title.toLowerCase().includes(q)
      const matchF = filter === 'all' || cfg.category === filter
      return matchQ && matchF
    })
  }, [PLATFORM_CONFIG, search, filter])

  return (
    <div className="flex flex-col gap-5 flex-1 w-full">
      {loadError && (
        <p className="text-[0.8125rem] text-red-500 dark:text-red-400">{loadError}</p>
      )}

      {/* search + filter */}
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
            placeholder="Search channels…"
            aria-label="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-[0.8125rem] border border-[var(--border-subtle)] rounded-lg bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--border-subtle)]"
          />
        </div>
        <div className="relative shrink-0">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="h-9 pl-3 pr-8 text-[0.8125rem] border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-0)] text-[var(--text-primary)] appearance-none focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none"
            viewBox="0 0 16 16" fill="currentColor"
          >
            <path fillRule="evenodd" clipRule="evenodd" d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z" />
          </svg>
        </div>
      </div>

      {/* channel cards */}
      <div className="flex flex-col gap-3">
        {visible.map(cfg => {
          const rows      = rowsByPlatform.get(cfg.id) ?? []
          const hasActive = rows.some(r => r.is_active)
          const href      = `/souls/${character.id}/channels/${cfg.id}`

          return (
            <div
              key={cfg.id}
              className="relative rounded-xl border border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-1)]"
            >
              <div className="flex flex-row items-center justify-between gap-4 px-4 py-3">
                {/* left: icon + info */}
                <div className="flex flex-row items-center gap-3">
                  <div
                    className="relative w-9 h-9 rounded-full flex overflow-hidden shrink-0"
                    aria-hidden
                  >
                    <cfg.Icon />
                    <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-[0.875rem] leading-5 font-medium text-[var(--text-primary)]">
                        {cfg.title}
                      </span>
                      {channels !== null && (
                        hasActive ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[0.6875rem] font-medium text-green-500">
                            <span className="h-1 w-1 rounded-full bg-green-500" aria-hidden />
                            Connected
                          </span>
                        ) : (
                          <span className="rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] px-2 py-0.5 text-[0.6875rem] font-medium text-[var(--text-tertiary)]">
                            Not configured
                          </span>
                        )
                      )}
                    </div>
                    <span className="text-[0.875rem] text-[var(--text-secondary)]">{cfg.category}</span>
                  </div>
                </div>

                {/* right: configure button — z-10 to sit above the overlay */}
                <a
                  href={href}
                  onClick={e => { e.preventDefault(); router.push(href) }}
                  className="relative z-10 inline-flex h-7 items-center px-3 text-[0.75rem] font-medium rounded-md border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
                >
                  Configure
                </a>
              </div>

              {/* invisible overlay — whole-card click target */}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Open ${cfg.title}`}
                className="absolute inset-0 rounded-xl cursor-pointer"
                onClick={() => router.push(href)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && router.push(href)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChannelTab
