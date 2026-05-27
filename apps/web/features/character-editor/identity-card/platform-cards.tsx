'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/shared/lib/character'
import type { ChannelResponse } from '@/shared/types/soul-api'
import { DiscordIcon, TwitchIcon, Toggle } from './icons'

interface PlatformCardsProps {
  character: AiCharacter
  onNavigateTab?: (tab: string) => void
}

export function PlatformCards({ character, onNavigateTab }: PlatformCardsProps) {
  const { t } = useTranslation('profile')

  const getChannelsForPlatform = (platform: string): ChannelResponse[] =>
    character.channels.filter(ch => ch.platform === platform)

  return (
    <div className="flex flex-col gap-3 border-t border-(--border) pt-4 mt-6">
      <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('identity.listening')}</div>
      <div className="grid grid-cols-3 gap-3">

        {(['discord', 'twitch'] as const).map((platform) => {
          const allChannels = getChannelsForPlatform(platform)
          const activeChannels = allChannels.filter(ch => ch.is_active)
          const isActive = activeChannels.length > 0
          const displayChannel = activeChannels[0] ?? allChannels[0]

          return (
            <div key={platform} className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-3 min-h-[130px] justify-between">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                  platform === 'discord' ? 'bg-[#5865F2]' : 'bg-[#9146FF]',
                )}>
                  {platform === 'discord' ? <DiscordIcon /> : <TwitchIcon />}
                </div>
                <div>
                  <div className="text-[0.9375rem] font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-1">{platform === 'discord' ? 'Discord' : 'Twitch'}</div>
                  {displayChannel ? (
                    <div className={cn(
                      'text-[0.75rem] mt-[0.2rem]',
                      isActive ? 'text-[#4ade80]' : 'text-(--text-muted)',
                    )}>
                      {platform === 'discord'
                        ? `#${displayChannel.channel_name}`
                        : displayChannel.channel_name}
                    </div>
                  ) : (
                    <div className="text-[0.75rem] text-(--text-muted) mt-[0.2rem]">{t('identity.notConnected')}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button type="button" className="text-[0.75rem] text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('connection')}>{t('identity.configure')}</button>
                <Toggle on={isActive} />
              </div>
            </div>
          )
        })}

        <button type="button" className="rounded-[14px] border border-dashed border-white/[0.14] bg-transparent p-4 flex flex-col items-center justify-center gap-2 min-h-[130px] cursor-pointer transition-all duration-200 ease hover:border-white/[0.24] hover:bg-white/[0.02]" onClick={() => onNavigateTab?.('connection')}>
          <div className="w-8 h-8 rounded-full border-[1.5px] border-dashed border-white/[0.22] flex items-center justify-center text-[1.125rem] text-white/[0.28] leading-none">+</div>
          <span className="text-[0.75rem] text-(--text-muted)">{t('identity.addChannel')}</span>
        </button>

      </div>
    </div>
  )
}
