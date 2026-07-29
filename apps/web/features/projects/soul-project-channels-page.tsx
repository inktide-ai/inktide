'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChannelTab } from '@/features/character-editor'
import { getProject, type Project } from '@/features/projects'
import { getCard } from '@/features/soul'
import { apiResponseToCharacter } from '@/shared/lib/character/mappers'
import type { AiCharacter } from '@/shared/lib/character'
import { handleError } from '@/shared/lib/handle-error'


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

function IconYouTube() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden width="36" height="36">
      <rect width="512" height="512" fill="#fff"/>
      <path d="M499.015 153.93a63.33 63.33 0 0 0-44.56-44.84C413.57 98 256 98 256 98s-157.57 0-198.455 11.09a63.33 63.33 0 0 0-44.56 44.84C2 195.05 2 256 2 256s0 60.95 10.985 102.07a63.33 63.33 0 0 0 44.56 44.84C98.43 414 256 414 256 414s157.57 0 198.455-11.09a63.33 63.33 0 0 0 44.56-44.84C510 313.95 510 256 510 256s0-60.95-10.985-102.07zM206 330V182l132 74z" fill="#FF0000"/>
    </svg>
  )
}

function IconTelegram() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" aria-hidden width="36" height="36">
      <defs>
        <linearGradient id="tg-sp-grad" x1="120" y1="240" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d93d2"/>
          <stop offset="1" stopColor="#38b0e3"/>
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill="url(#tg-sp-grad)"/>
      <path d="M81.229,128.772l14.237,39.406s1.78,3.687,3.686,3.687,30.255-29.492,30.255-29.492l31.525-60.89L81.737,118.6Z" fill="#c8daea"/>
      <path d="M100.106,138.878l-2.733,29.046s-1.144,8.9,7.754,0,17.415-15.763,17.415-15.763" fill="#a9c6d8"/>
      <path d="M81.486,130.178,52.2,120.636s-3.5-1.42-2.373-4.64c.232-.664.7-1.229,2.1-2.2,6.489-4.523,120.106-45.36,120.106-45.36s3.208-1.081,5.1-.362a2.766,2.766,0,0,1,1.885,2.055,9.357,9.357,0,0,1,.254,2.585c-.009.752-.1,1.449-.169,2.542-.692,11.165-21.4,94.493-21.4,94.493s-1.239,4.876-5.678,5.043A8.13,8.13,0,0,1,146.1,172.5c-8.711-7.493-38.819-27.727-45.472-32.177a1.27,1.27,0,0,1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6,53.821-51.492c.108-.379-.3-.566-.848-.4-3.482,1.281-63.844,39.4-70.506,43.607A3.21,3.21,0,0,1,81.486,130.178Z" fill="#fff"/>
    </svg>
  )
}


const BROWSE_PLATFORMS = [
  { id: 'discord',  name: 'Discord',  description: 'Route guild messages to your AI character in real-time.',    icon: IconDiscord  },
  { id: 'twitch',   name: 'Twitch',   description: 'Let your character react to live chat and stream events.',    icon: IconTwitch   },
  { id: 'youtube',  name: 'YouTube',  description: 'Connect live stream chat to drive AI responses.',            icon: IconYouTube  },
  { id: 'telegram', name: 'Telegram', description: 'Connect a Telegram bot to relay chat messages to your AI.', icon: IconTelegram },
] as const


const btnSecondary =
  'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-transparent px-4 text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-subtle)]'

const btnPrimary =
  'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-[var(--text-primary)] px-4 text-body font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90 focus-visible:outline-none'


export default function SoulProjectChannelsPage() {
  const { projectId } = useParams<{ id: string; projectId: string }>()
  const { t } = useTranslation('common')

  const [project, setProject]     = useState<Project | null>(null)
  const [character, setCharacter] = useState<AiCharacter | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    getProject(projectId)
      .then(async p => {
        setProject(p)
        if (p.active_soul_id) {
          const card = await getCard(p.active_soul_id)
          setCharacter(apiResponseToCharacter(card))
        }
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div className="p-8 text-sm text-[var(--text-secondary)]">{t('projectDetail.loading')}</div>
  }

  if (!character) return null

  return (
    /* mirrors Vercel: container div (flex: 0 0 auto) + left (flex-1 my-6) */
    <div className="mx-auto w-full max-w-[1248px] px-6 flex-none">
      <div className="my-6 flex flex-1 flex-col min-w-0">
        <section className="flex flex-col gap-6">

          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center md:gap-2">
            <div className="flex flex-col gap-2">
              <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">
                {t('projectDetail.channels')}
              </h2>
              <span className="text-body text-balance text-[var(--text-secondary)]">
                {t('projectDetail.channelsSubtitle')}
                {project?.active_soul && (
                  <> {t('projectDetail.channelsPoweredBy')} <span className="font-medium text-[var(--text-primary)]">{project.active_soul.name}</span>.</>
                )}
              </span>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:flex-row">
              <a href="#" className={btnSecondary}>{t('projectDetail.channelsConsole')}</a>
              <a href={`/souls/${character.id}/channels/marketplace`} className={btnPrimary}>{t('projectDetail.browseMarketplace')}</a>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* left: installed channels */}
            <div className="flex flex-col items-stretch justify-start gap-5 flex-1 w-full">
              <ChannelTab character={character} />
            </div>

            {/* right: latest platforms - mirrors recommendations-module */}
            <div className="flex flex-col items-center justify-start gap-6 flex-initial p-6 border border-[var(--border-subtle)] rounded-xl w-[305px] shrink-0">
              <Layers size={24} />

              <div className="flex flex-col items-center justify-start gap-1">
                <p className="text-[1rem] font-semibold text-center text-[var(--text-heading)]">
                  {t('projectDetail.latestPlatforms')}
                </p>
                <p className="text-body text-[var(--text-secondary)] text-center">
                  {t('projectDetail.latestPlatformsDesc')}
                </p>
              </div>

              <div className="flex flex-col items-stretch justify-start gap-6">
                {BROWSE_PLATFORMS.map(({ id, name, description, icon: Icon }) => (
                  <a key={id} href="#" className="no-underline group outline-none">
                    <div className="flex flex-row items-stretch justify-start gap-3">
                      <div
                        className="relative w-9 h-9 rounded-full flex overflow-hidden shrink-0"
                        aria-hidden
                      >
                        <Icon />
                        <span className="absolute inset-0 rounded-full border border-[#ffffff24] pointer-events-none" />
                      </div>
                      <div className="flex flex-col items-stretch justify-start">
                        <p className="text-[1rem] font-semibold text-[var(--text-primary)] leading-snug group-hover:text-[var(--text-heading)] transition-colors">
                          {name}
                        </p>
                        <p className="text-body text-[var(--text-secondary)] leading-snug">
                          {description}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              <hr className="w-full border-t border-[var(--border-subtle)]" />

              <a href={`/souls/${character.id}/channels/marketplace`} className={btnSecondary + ' w-full justify-center'}>
                {t('projectDetail.browseMarketplace')}
              </a>
            </div>

          </div>
        </section>
      </div>
    </div>
  )
}
