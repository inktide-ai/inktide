'use client'
import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { uploadCardAvatar, type ChannelResponse } from '../../api/soul'
import type { AiCharacter } from '@/lib/character'
import { getBannerAccent, getBannerStyle } from './banner-presets'
import { cn } from '@/lib/utils'

interface IdentityCardProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  onDelete?: () => void
  onNavigateTab?: (tab: string) => void
}

function fmtProvider(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Service logos ──────────────────────────────────────────────────────────────



function DiscordIcon() {
  return (
    <svg width="22" height="17" viewBox="0 0 71 55" fill="#fff" aria-hidden>
      <path d="M60.1 4.9A58.5 58.5 0 0045.5 1a40 40 0 00-1.9 3.9 54.1 54.1 0 00-16.2 0A41 41 0 0025.4 1 58.5 58.5 0 0010.9 4.9C1.6 18.8-1 32.4.3 45.8a59 59 0 0018 9.1 44 44 0 003.8-6.2 38.1 38.1 0 01-6-2.9l1.5-1.2c11.5 5.3 24 5.3 35.4 0l1.5 1.2a38.1 38.1 0 01-6 2.9 44 44 0 003.8 6.2 58.8 58.8 0 0018-9.1c1.5-15.6-2.5-29.1-10.2-40.9zM23.7 37.7c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1c3.5 0 6.4 3.2 6.4 7.1 0 3.9-2.9 7.1-6.4 7.1zm23.6 0c-3.5 0-6.4-3.2-6.4-7.1s2.8-7.1 6.4-7.1 6.4 3.2 6.4 7.1c0 3.9-2.9 7.1-6.4 7.1z"/>
    </svg>
  )
}

function TwitchIcon() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 28" fill="#fff" aria-hidden>
      <path d="M2.1 0L0 5.25V24.5h6.3V28h3.5l3.5-3.5h5.25l7-7V0H2.1zm19.6 13.3l-4.2 4.2h-5.25l-3.5 3.5v-3.5H3.5V2.1h18.2v11.2z"/>
      <path d="M9.8 5.95H11.9v6.3H9.8z"/>
      <path d="M15.75 5.95h2.1v6.3h-2.1z"/>
    </svg>
  )
}


function getBrainLogo(providerId: string | null): ReactNode {
  const s: React.CSSProperties = { width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }
  switch ((providerId ?? '').toLowerCase()) {
    case 'anthropic':
    case 'claude': return <img src="/images/providers/brain/anthropic.svg" style={s} alt="" aria-hidden />
    case 'openai': return <img src="/images/providers/brain/chatgpt.svg" style={s} alt="" aria-hidden />
    default: return <img src="/images/providers/brain/ollama.svg" style={s} alt="" aria-hidden />
  }
}

function getVoiceLogo(providerId: string | null): ReactNode {
  const s: React.CSSProperties = { width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }
  switch ((providerId ?? '').toLowerCase()) {
    case 'elevenlabs': return <img src="/images/providers/voice/elevenlabs-identity.svg" style={s} alt="" aria-hidden />
    case 'kokoro': return <img src="/images/providers/voice/kokoro.svg" style={s} alt="" aria-hidden />
    default: return <img src="/images/providers/voice/kokoro.svg" style={s} alt="" aria-hidden />
  }
}

function formatLlmProvider(providerId: string | null, modelId: string | null, notConfigured: string): string {
  if (!providerId) return notConfigured
  if (modelId) return modelId
  return fmtProvider(providerId)
}

function formatTtsProvider(providerId: string | null, notConfigured: string): string {
  if (!providerId || providerId === 'none') return notConfigured
  return fmtProvider(providerId)
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={cn(
      'relative w-9 h-5 rounded-[10px] shrink-0 transition-[background] duration-200 ease cursor-default',
      on ? 'bg-[#22c55e]' : 'bg-white/[0.12]',
    )}>
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left] duration-200 ease shadow-[0_1px_3px_rgba(0,0,0,0.35)]',
        on ? 'left-[18px]' : 'left-0.5',
      )} />
    </div>
  )
}

// ── Pencil ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="currentColor"
      />
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────────────────────────

const IdentityCard = ({ character, onUpdate, onDelete, onNavigateTab }: IdentityCardProps) => {
  const router = useRouter()
  const { t } = useTranslation(['profile', 'common'])
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

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

  // ── Channel data by platform ──
  const getChannelsForPlatform = (platform: string): ChannelResponse[] =>
    character.channels.filter(ch => ch.platform === platform)

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      {/* ── Profile card ── */}
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

      {/* ── Services ── */}
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
                <div className="text-[0.9375rem] font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.brainAI')}</div>
                <div className="text-[0.75rem] text-(--text-muted) mt-[0.2rem]">{formatLlmProvider(character.llm.providerId, character.llm.modelId, t('identity.notConfigured'))}</div>
              </div>
            </div>
            <img src="/images/illustrations/brain.png" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
            <div className="flex items-center justify-between relative z-[1]">
              <button type="button" className="text-[0.75rem] text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('brain')}>{t('identity.configure')}</button>
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
                <div className="text-[0.9375rem] font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.voiceAI')}</div>
                <div className="text-[0.75rem] text-(--text-muted) mt-[0.2rem]">{formatTtsProvider(character.tts.providerId, t('identity.notConfigured'))}</div>
              </div>
            </div>
            <img src="/images/illustrations/voice.png" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
            <div className="flex items-center justify-between relative z-[1]">
              <button type="button" className="text-[0.75rem] text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('voice')}>{t('identity.configure')}</button>
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
                <div className="text-[0.9375rem] font-bold text-(--text-primary) tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.visionAI')}</div>
                <div className="text-[0.75rem] text-(--text-muted) mt-[0.2rem]">{t('identity.notConfigured')}</div>
              </div>
            </div>
            <img src="/images/illustrations/vision.webp" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
            <div className="flex items-center justify-between relative z-[1]">
              <button type="button" className="text-[0.75rem] text-(--text-muted) bg-transparent border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 ease hover:text-(--text-primary)" onClick={() => onNavigateTab?.('skills')}>{t('identity.configure')}</button>
              <Toggle on={false} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Listening ── */}
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

      {/* ── Account Management ── */}
      <div className="flex flex-col gap-3 border-t border-(--border) pt-4 mt-6">
        <div className="text-[1.125rem] font-bold text-(--text-primary) tracking-[-0.02em] mb-2">{t('identity.accountManagement')}</div>
        <div className="bg-transparent border-none overflow-visible">
          <div className="flex items-center justify-between gap-6 px-6 py-5 flex-wrap">
            <div>
              <div className="text-[0.9375rem] font-bold text-(--text-primary) mb-1">
                {character.isActive ? t('identity.deactivate') : t('identity.activate')}
              </div>
              <div className="text-[0.8125rem] text-(--text-muted) leading-relaxed max-w-[400px]">
                {character.isActive ? t('identity.deactivateDesc') : t('identity.activateDesc')}
              </div>
            </div>
            {deactivateConfirm ? (
              <div className="flex items-center gap-[0.625rem] flex-wrap">
                <span className="text-[0.8125rem] text-(--text-muted) whitespace-nowrap">{t('identity.areYouSure')}</span>
                <button
                  type="button"
                  className="px-[1.125rem] py-2 bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] rounded-lg text-[#fbbf24] font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-[rgba(251,191,36,0.2)]"
                  onClick={() => {
                    onUpdate({ isActive: !character.isActive })
                    setDeactivateConfirm(false)
                  }}
                >
                  {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-transparent border border-(--border) rounded-lg text-(--text-muted) font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-white/[0.04] hover:text-(--text-primary)"
                  onClick={() => setDeactivateConfirm(false)}
                >
                  {t('common:action.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={cn(
                  'px-[1.125rem] py-2 rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap',
                  character.isActive
                    ? 'bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.2)]'
                    : 'bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] text-[#4ade80] hover:bg-[rgba(34,197,94,0.2)]',
                )}
                onClick={() => setDeactivateConfirm(true)}
              >
                {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
              </button>
            )}
          </div>

          <div className="h-px bg-[rgba(237,62,62,0.12)] mx-6" />

          <div className="flex items-center justify-between gap-6 px-6 py-5 flex-wrap">
            <div>
              <div className="text-[0.9375rem] font-bold text-(--text-primary) mb-1">{t('identity.deleteCharacter')}</div>
              <div className="text-[0.8125rem] text-(--text-muted) leading-relaxed max-w-[400px]">{t('identity.deleteDesc')}</div>
            </div>
            {deleteConfirm ? (
              <div className="flex items-center gap-[0.625rem] flex-wrap">
                <span className="text-[0.8125rem] text-(--text-muted) whitespace-nowrap">{t('identity.isPermanent')}</span>
                <button
                  type="button"
                  className="px-[1.125rem] py-2 bg-[rgba(237,62,62,0.15)] border border-[rgba(237,62,62,0.4)] rounded-lg text-(--accent-red-bright) font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-[rgba(237,62,62,0.25)]"
                  onClick={() => {
                    onDelete?.()
                    setDeleteConfirm(false)
                  }}
                >
                  {t('identity.deleteForever')}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-transparent border border-(--border) rounded-lg text-(--text-muted) font-[var(--font-ui)] text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-white/[0.04] hover:text-(--text-primary)"
                  onClick={() => setDeleteConfirm(false)}
                >
                  {t('common:action.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="px-[1.125rem] py-2 bg-transparent border border-[rgba(237,62,62,0.3)] rounded-lg text-(--accent-red) font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 ease whitespace-nowrap hover:bg-[rgba(237,62,62,0.08)] hover:border-[rgba(237,62,62,0.5)]"
                onClick={() => setDeleteConfirm(true)}
              >
                {t('identity.deleteCharacter')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdentityCard
