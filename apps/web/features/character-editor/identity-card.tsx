'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/shared/lib/character'
import { ProfileHero } from './identity-card/profile-hero'
import { ServiceCards } from './identity-card/service-cards'
import { PlatformCards } from './identity-card/platform-cards'
import { AccountManagement } from './identity-card/account-management'

interface IdentityCardProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  onDelete?: () => void
  onNavigateTab?: (tab: string) => void
}

const IdentityCard = ({ character, onUpdate, onDelete, onNavigateTab }: IdentityCardProps) => {
  const { t } = useTranslation(['profile', 'common'])

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">

      <ProfileHero character={character} onUpdate={onUpdate} />

      {/* ── Status ── */}
      <div className="flex flex-col gap-3 border-t border-(--border) pt-4 mt-6">
        <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('identity.status')}</div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-[0.875rem] flex flex-col gap-[0.3rem]">
            <div className="text-[0.625rem] font-medium uppercase tracking-[0.07em] text-white/35">{t('identity.language')}</div>
            <div className="text-[0.9375rem] font-semibold text-(--text-primary) tracking-[-0.01em]">{character.behavior.language.toUpperCase()}</div>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-[0.875rem] flex flex-col gap-[0.3rem]">
            <div className="text-[0.625rem] font-medium uppercase tracking-[0.07em] text-white/35">{t('identity.visibility')}</div>
            <div className="text-[0.9375rem] font-semibold text-(--text-primary) tracking-[-0.01em]" style={{ textTransform: 'capitalize' }}>{character.visibility}</div>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-[0.875rem] flex flex-col gap-[0.3rem]">
            <div className="text-[0.625rem] font-medium uppercase tracking-[0.07em] text-white/35">{t('identity.autoPilot')}</div>
            <div className={cn(
              'text-[0.9375rem] font-semibold tracking-[-0.01em]',
              character.autoPilot.enabled ? 'text-[#4ade80]' : 'text-white/30',
            )}>
              {character.autoPilot.enabled ? t('common:badge.on') : t('common:badge.off')}
            </div>
          </div>
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-[0.875rem] flex flex-col gap-[0.3rem]">
            <div className="text-[0.625rem] font-medium uppercase tracking-[0.07em] text-white/35">{t('identity.autoModerate')}</div>
            <div className={cn(
              'text-[0.9375rem] font-semibold tracking-[-0.01em]',
              character.behavior.autoModerate ? 'text-[#4ade80]' : 'text-white/30',
            )}>
              {character.behavior.autoModerate ? t('common:badge.on') : t('common:badge.off')}
            </div>
          </div>
        </div>
      </div>

      <ServiceCards character={character} onNavigateTab={onNavigateTab} />
      <PlatformCards character={character} onNavigateTab={onNavigateTab} />
      <AccountManagement character={character} onUpdate={onUpdate} onDelete={onDelete} />

    </div>
  )
}

export default IdentityCard
