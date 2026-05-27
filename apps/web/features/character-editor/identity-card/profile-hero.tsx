'use client'

import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { uploadCardAvatar } from '@/entities/soul/api'
import type { AiCharacter } from '@/shared/lib/character'
import { getBannerAccent, getBannerStyle } from '@/shared/ui/banner-presets'
import { PencilIcon } from './icons'

interface ProfileHeroProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

export function ProfileHero({ character, onUpdate }: ProfileHeroProps) {
  const router = useRouter()
  const { t } = useTranslation(['profile', 'common'])
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)

  const bannerIdx = character.appearance.bannerColorIndex
  const bannerStyle = getBannerStyle(bannerIdx, character.appearance.bannerCustomColor)
  const accentColor = character.appearance.bannerCustomColor ?? getBannerAccent(bannerIdx)
  const initial = character.name.charAt(0).toUpperCase()

  const onAvatarFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) return
      setAvatarBusy(true)
      try {
        const res = await uploadCardAvatar(character.id, file)
        onUpdate({ appearance: { ...character.appearance, avatarUrl: res.avatar_url } })
      } catch {
        /* optional toast */
      } finally {
        setAvatarBusy(false)
      }
    },
    [character.id, character.appearance, onUpdate],
  )

  return (
    <div className="bg-(--bg-surface) border border-(--border) rounded-2xl overflow-visible">
      <div
        className="h-[100px] relative rounded-t-2xl overflow-hidden"
        style={
          character.appearance.bannerImageUrl
            ? { backgroundImage: `url(${character.appearance.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: bannerStyle }
        }
      />

      <div className="px-5 pb-5 flex items-end gap-4 flex-wrap">
        <div className="relative -mt-11 shrink-0">
          <button
            type="button"
            className="group relative w-[88px] h-[88px] p-0 border-none rounded-full cursor-pointer shrink-0 bg-transparent overflow-hidden shadow-[0_0_0_5px_var(--bg-surface)] disabled:cursor-wait disabled:opacity-85"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            aria-label={t('edit.avatar.changeAriaLabel')}
          >
            {character.appearance.avatarUrl ? (
              <img src={character.appearance.avatarUrl} alt="" className="w-full h-full object-cover block rounded-full" />
            ) : (
              <div
                className="w-full h-full rounded-full bg-[linear-gradient(135deg,#3b4a6b,#5c3d8f)] flex items-center justify-center font-extrabold text-[1.75rem] text-white tracking-[-0.02em]"
                style={{ background: bannerStyle }}
              >
                {initial}
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity duration-[180ms] ease rounded-full group-hover:opacity-100 group-disabled:opacity-0">
              {avatarBusy ? '…' : <PencilIcon />}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="absolute w-0 h-0 opacity-0 pointer-events-none"
            onChange={onAvatarFile}
          />
          {character.isActive && <span className="absolute bottom-1 right-1 w-[14px] h-[14px] rounded-full bg-[#22c55e] border-[3px] border-(--bg-surface)" />}
        </div>

        <div className="flex-1 min-w-0 pt-2">
          <div className="text-[1.25rem] font-extrabold text-(--text-primary) tracking-[-0.02em]">{character.name}</div>
          <div className="text-[0.8125rem] text-(--text-muted) mt-0.5 font-mono">/{character.slug}</div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <span
              className="text-[0.5625rem] font-semibold py-0.5 px-2 rounded-[0.25rem] bg-white/[0.08] text-(--text-muted)"
              style={{ background: `${accentColor}30`, color: accentColor }}
            >{t('common:badge.bot')}</span>
            {character.tts.providerId && character.tts.providerId !== 'none' && (
              <span className="text-[0.5625rem] font-semibold py-0.5 px-2 rounded-[0.25rem] bg-[rgba(139,92,246,0.18)] text-[#a78bfa]">TTS</span>
            )}
            {character.memory.enabled && (
              <span className="text-[0.5625rem] font-semibold py-0.5 px-2 rounded-[0.25rem] bg-[rgba(34,211,238,0.14)] text-[#67e8f9]">Memory</span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="ml-auto px-[1.125rem] py-2 bg-white/[0.06] border border-(--border) rounded-lg text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap self-end hover:bg-white/10 hover:border-white/[0.12]"
          onClick={() => router.push(`/home/bot/${character.id}/edit`)}
        >
          {t('identity.editCharacter')}
        </button>
      </div>

      {character.personality ? (
        <div className="px-5 pb-5 pt-4 border-t border-white/[0.06]">
          <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-(--text-muted) mb-2">{t('identity.about')}</div>
          <p className="m-0 text-[0.875rem] leading-relaxed text-[rgba(200,204,214,0.9)]">
            {character.personality.length > 160
              ? `${character.personality.slice(0, 160)}…`
              : character.personality}
          </p>
        </div>
      ) : null}
    </div>
  )
}
