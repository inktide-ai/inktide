'use client'

import { useTranslation } from 'react-i18next'
import type { AiCharacter } from '@/shared/lib/character'
import { Toggle } from './icons'
import { getBrainLogo, getVoiceLogo, formatLlmProvider, formatTtsProvider } from './identity-card-utils'

interface ServiceCardsProps {
  character: AiCharacter
  onNavigateTab?: (tab: string) => void
}

export function ServiceCards({ character, onNavigateTab }: ServiceCardsProps) {
  const { t } = useTranslation('profile')

  return (
    <div className="flex flex-col gap-3 border-t border-(--border) pt-4 mt-6">
      <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('identity.services')}</div>
      <div className="grid grid-cols-3 gap-3">

        {/* Brain AI */}
        <div className="relative rounded-[14px] overflow-hidden min-h-[155px] flex flex-col justify-between p-4 gap-2 border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-start gap-3 relative z-[1]">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden bg-[#c84100]">
              {getBrainLogo(character.llm.providerId)}
            </div>
            <div>
              <div className="text-body-md font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.brainAI')}</div>
              <div className="text-xs text-(--text-muted) mt-[0.2rem]">{formatLlmProvider(character.llm.providerId, character.llm.modelId, t('identity.notConfigured'))}</div>
            </div>
          </div>
          <img src="/images/illustrations/brain.png" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
          <div className="flex items-center justify-between relative z-[1]">
            <button type="button" className="text-xs text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('brain')}>{t('identity.configure')}</button>
            <Toggle on={!!character.llm.providerId} />
          </div>
        </div>

        {/* Voice AI */}
        <div className="relative rounded-[14px] overflow-hidden min-h-[155px] flex flex-col justify-between p-4 gap-2 border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-start gap-3 relative z-[1]">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden bg-[#111] border border-white/10">
              {getVoiceLogo(character.tts.providerId)}
            </div>
            <div>
              <div className="text-body-md font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.voiceAI')}</div>
              <div className="text-xs text-(--text-muted) mt-[0.2rem]">{formatTtsProvider(character.tts.providerId, t('identity.notConfigured'))}</div>
            </div>
          </div>
          <img src="/images/illustrations/voice.png" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
          <div className="flex items-center justify-between relative z-[1]">
            <button type="button" className="text-xs text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('voice')}>{t('identity.configure')}</button>
            <Toggle on={!!character.tts.providerId && character.tts.providerId !== 'none'} />
          </div>
        </div>

        {/* Vision AI */}
        <div className="relative rounded-[14px] overflow-hidden min-h-[155px] flex flex-col justify-between p-4 gap-2 border border-white/[0.07] bg-white/[0.02]">
          <div className="flex items-start gap-3 relative z-[1]">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 overflow-hidden bg-[#081a0c] border border-[rgba(34,197,94,0.2)]">
              <img src="/images/providers/brain/chatgpt.svg" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }} alt="" aria-hidden />
            </div>
            <div>
              <div className="text-body-md font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.visionAI')}</div>
              <div className="text-xs text-(--text-muted) mt-[0.2rem]">{t('identity.notConfigured')}</div>
            </div>
          </div>
          <img src="/images/illustrations/vision.webp" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
          <div className="flex items-center justify-between relative z-[1]">
            <button type="button" className="text-xs text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('skills')}>{t('identity.configure')}</button>
            <Toggle on={false} />
          </div>
        </div>

      </div>
    </div>
  )
}
