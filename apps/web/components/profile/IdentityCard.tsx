'use client'
import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { uploadCardAvatar, type ChannelResponse } from '../../api/soul'
import { cn } from '@/lib/utils'
import type { AiCharacter } from '@/lib/character'
import { getBannerAccent, getBannerStyle } from './bannerPresets'

interface IdentityCardProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  onDelete?: () => void
  onNavigateTab?: (tab: string) => void
}

function fmtProvider(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

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

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={cn(
      'relative w-9 h-5 rounded-[10px] shrink-0 transition-[background] duration-200 cursor-default',
      on ? 'bg-[#22c55e]' : 'bg-white/[0.12]',
    )}>
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-[left] duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.35)]',
        on ? 'left-[18px]' : 'left-0.5',
      )} />
    </div>
  )
}

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

const sectionCls = 'flex flex-col gap-3 border-t border-[var(--border)] pt-4 mt-6'
const sectionTitleCls = 'text-[1.125rem] font-bold text-[var(--text-primary)] tracking-[-0.02em] mb-2'
const serviceConfigureBtnCls = 'text-[0.75rem] text-[var(--text-muted)] bg-none border-none p-0 cursor-pointer font-[var(--font-ui)] transition-[color] duration-150 hover:text-[var(--text-primary)]'
const dangerBtnBase = 'py-2 px-[1.125rem] rounded-lg font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap'

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

  const getChannelsForPlatform = (platform: string): ChannelResponse[] =>
    character.channels.filter(ch => ch.platform === platform)

  return (
    <div className="flex flex-col gap-6 max-w-[840px] mx-auto w-full">
      {/* ── Profile card ── */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl overflow-visible">
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
                <div className="w-full h-full rounded-full flex items-center justify-center font-extrabold text-[1.75rem] text-white tracking-[-0.02em]" style={{ background: bannerStyle }}>
                  {initial}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity duration-[180ms] rounded-full group-hover:opacity-100">
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
            {character.isActive && (
              <span className="absolute bottom-1 right-1 w-[14px] h-[14px] rounded-full bg-[#22c55e] border-[3px] border-[var(--bg-surface)]" />
            )}
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <div className="text-[1.25rem] font-extrabold text-[var(--text-primary)] tracking-[-0.02em]">{character.name}</div>
            <div className="text-[0.8125rem] text-[var(--text-muted)] mt-0.5 font-[var(--font-mono)]">/{character.slug}</div>
            <div className="flex gap-[0.375rem] mt-2 flex-wrap">
              <span className="text-[0.5625rem] font-semibold py-0.5 px-2 rounded-[0.25rem] bg-white/[0.08] text-[var(--text-muted)]"
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
            className="ml-auto py-2 px-[1.125rem] bg-white/[0.06] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-[var(--font-ui)] text-[0.8125rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap self-end hover:bg-white/10 hover:border-white/[0.12]"
            onClick={() => router.push(`/home/bot/${character.id}/edit`)}
          >
            {t('identity.editCharacter')}
          </button>
        </div>

        {character.personality ? (
          <div className="px-5 pb-5 pt-4 border-t border-white/[0.06]">
            <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] mb-2">{t('identity.about')}</div>
            <p className="m-0 text-[0.875rem] leading-[1.5] text-[rgba(200,204,214,0.9)]">
              {character.personality.length > 160
                ? `${character.personality.slice(0, 160)}…`
                : character.personality}
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Status ── */}
      <div className={sectionCls}>
        <div className={sectionTitleCls}>{t('identity.status')}</div>
        <div className="grid grid-cols-4 gap-2 max-[600px]:grid-cols-2">
          {[
            { label: t('identity.language'), value: character.behavior.language.toUpperCase(), accent: false },
            { label: t('identity.visibility'), value: character.visibility, style: { textTransform: 'capitalize' as const }, accent: false },
            { label: t('identity.autoPilot'), value: character.autoPilot.enabled ? t('common:badge.on') : t('common:badge.off'), on: character.autoPilot.enabled, accent: true },
            { label: t('identity.autoModerate'), value: character.behavior.autoModerate ? t('common:badge.on') : t('common:badge.off'), on: character.behavior.autoModerate, accent: true },
          ].map((item, i) => (
            <div key={i} className="bg-white/[0.04] border border-white/[0.07] rounded-[12px] py-[0.875rem] px-4 flex flex-col gap-[0.3rem]">
              <div className="text-[0.625rem] font-medium uppercase tracking-[0.07em] text-white/35">{item.label}</div>
              <div className={cn(
                'text-[0.9375rem] font-semibold tracking-[-0.01em]',
                item.accent
                  ? (item.on ? 'text-[#4ade80]' : 'text-white/30')
                  : 'text-[var(--text-primary)]',
              )} style={item.style}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Services ── */}
      <div className={sectionCls}>
        <div className={sectionTitleCls}>{t('identity.services')}</div>
        <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
          {/* Brain AI */}
          <div className="relative rounded-[14px] overflow-hidden min-h-[155px] flex flex-col justify-between p-4 gap-2 border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-start gap-3 relative z-[1]">
              {getBrainLogo(character.llm.providerId)}
              <div>
                <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.brainAI')}</div>
                <div className="text-[0.75rem] text-[var(--text-muted)] mt-[0.2rem]">{formatLlmProvider(character.llm.providerId, character.llm.modelId, t('identity.notConfigured'))}</div>
              </div>
            </div>
            <img src="/images/illustrations/brain.png" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
            <div className="flex items-center justify-between relative z-[1]">
              <button type="button" className={serviceConfigureBtnCls} onClick={() => onNavigateTab?.('brain')}>{t('identity.configure')}</button>
              <Toggle on={!!character.llm.providerId} />
            </div>
          </div>

          {/* Voice AI */}
          <div className="relative rounded-[14px] overflow-hidden min-h-[155px] flex flex-col justify-between p-4 gap-2 border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-start gap-3 relative z-[1]">
              {getVoiceLogo(character.tts.providerId)}
              <div>
                <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.voiceAI')}</div>
                <div className="text-[0.75rem] text-[var(--text-muted)] mt-[0.2rem]">{formatTtsProvider(character.tts.providerId, t('identity.notConfigured'))}</div>
              </div>
            </div>
            <img src="/images/illustrations/voice.png" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
            <div className="flex items-center justify-between relative z-[1]">
              <button type="button" className={serviceConfigureBtnCls} onClick={() => onNavigateTab?.('voice')}>{t('identity.configure')}</button>
              <Toggle on={!!character.tts.providerId && character.tts.providerId !== 'none'} />
            </div>
          </div>

          {/* Vision AI */}
          <div className="relative rounded-[14px] overflow-hidden min-h-[155px] flex flex-col justify-between p-4 gap-2 border border-white/[0.07] bg-white/[0.02]">
            <div className="flex items-start gap-3 relative z-[1]">
              <img src="/images/providers/brain/chatgpt.svg" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }} alt="" aria-hidden />
              <div>
                <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] tracking-[-0.01em] leading-[1.2] mt-[0.15rem]">{t('identity.visionAI')}</div>
                <div className="text-[0.75rem] text-[var(--text-muted)] mt-[0.2rem]">{t('identity.notConfigured')}</div>
              </div>
            </div>
            <img src="/images/illustrations/vision.webp" className="absolute right-0 top-1/2 -translate-y-1/2 h-[80%] max-h-[130px] w-auto object-contain opacity-[0.28] pointer-events-none select-none" alt="" aria-hidden />
            <div className="flex items-center justify-between relative z-[1]">
              <button type="button" className={serviceConfigureBtnCls} onClick={() => onNavigateTab?.('skills')}>{t('identity.configure')}</button>
              <Toggle on={false} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Listening ── */}
      <div className={sectionCls}>
        <div className={sectionTitleCls}>{t('identity.listening')}</div>
        <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
          {(['discord', 'twitch'] as const).map((platform) => {
            const allChannels = getChannelsForPlatform(platform)
            const activeChannels = allChannels.filter(ch => ch.is_active)
            const isActive = activeChannels.length > 0
            const displayChannel = activeChannels[0] ?? allChannels[0]
            return (
              <div key={platform} className="rounded-[14px] border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-3 min-h-[130px] justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0',
                    platform === 'discord' ? 'bg-[#5865F2]' : 'bg-[#9146FF]',
                  )}>
                    {platform === 'discord' ? <DiscordIcon /> : <TwitchIcon />}
                  </div>
                  <div>
                    <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] tracking-[-0.01em] leading-[1.2] mt-1">{platform === 'discord' ? 'Discord' : 'Twitch'}</div>
                    {displayChannel ? (
                      <div className={cn('text-[0.75rem] mt-[0.2rem]', isActive ? 'text-[#4ade80]' : 'text-[var(--text-muted)]')}>
                        {platform === 'discord' ? `#${displayChannel.channel_name}` : displayChannel.channel_name}
                      </div>
                    ) : (
                      <div className="text-[0.75rem] text-[var(--text-muted)] mt-[0.2rem]">{t('identity.notConnected')}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" className={serviceConfigureBtnCls} onClick={() => onNavigateTab?.('connection')}>{t('identity.configure')}</button>
                  <Toggle on={isActive} />
                </div>
              </div>
            )
          })}

          <button
            type="button"
            className="rounded-[14px] border border-dashed border-white/[0.14] bg-transparent p-4 flex flex-col items-center justify-center gap-2 min-h-[130px] cursor-pointer transition-all duration-200 hover:border-white/[0.24] hover:bg-white/[0.02]"
            onClick={() => onNavigateTab?.('connection')}
          >
            <div className="w-8 h-8 rounded-full border-[1.5px] border-dashed border-white/[0.22] flex items-center justify-center text-[1.125rem] text-white/[0.28] leading-none">+</div>
            <span className="text-[0.75rem] text-[var(--text-muted)]">{t('identity.addChannel')}</span>
          </button>
        </div>
      </div>

      {/* ── Account Management ── */}
      <div className={sectionCls}>
        <div className={sectionTitleCls}>{t('identity.accountManagement')}</div>
        <div>
          <div className="flex items-center justify-between gap-6 py-5 px-6 flex-wrap">
            <div>
              <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] mb-1">
                {character.isActive ? t('identity.deactivate') : t('identity.activate')}
              </div>
              <div className="text-[0.8125rem] text-[var(--text-muted)] leading-[1.5] max-w-[400px]">
                {character.isActive ? t('identity.deactivateDesc') : t('identity.activateDesc')}
              </div>
            </div>
            {deactivateConfirm ? (
              <div className="flex items-center gap-[0.625rem] flex-wrap">
                <span className="text-[0.8125rem] text-[var(--text-muted)] whitespace-nowrap">{t('identity.areYouSure')}</span>
                <button
                  type="button"
                  className={cn(dangerBtnBase, 'bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.2)]')}
                  onClick={() => { onUpdate({ isActive: !character.isActive }); setDeactivateConfirm(false) }}
                >
                  {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
                </button>
                <button
                  type="button"
                  className={cn(dangerBtnBase, '!px-4 bg-transparent border border-[var(--border)] text-[var(--text-muted)] font-medium hover:bg-white/[0.04] hover:text-[var(--text-primary)]')}
                  onClick={() => setDeactivateConfirm(false)}
                >
                  {t('common:action.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={cn(dangerBtnBase, character.isActive
                  ? 'bg-[rgba(251,191,36,0.12)] border border-[rgba(251,191,36,0.3)] text-[#fbbf24] hover:bg-[rgba(251,191,36,0.2)]'
                  : 'bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.3)] text-[#4ade80] hover:bg-[rgba(34,197,94,0.2)]'
                )}
                onClick={() => setDeactivateConfirm(true)}
              >
                {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
              </button>
            )}
          </div>

          <div className="h-px bg-[rgba(237,62,62,0.12)] mx-6" />

          <div className="flex items-center justify-between gap-6 py-5 px-6 flex-wrap">
            <div>
              <div className="text-[0.9375rem] font-bold text-[var(--text-primary)] mb-1">{t('identity.deleteCharacter')}</div>
              <div className="text-[0.8125rem] text-[var(--text-muted)] leading-[1.5] max-w-[400px]">{t('identity.deleteDesc')}</div>
            </div>
            {deleteConfirm ? (
              <div className="flex items-center gap-[0.625rem] flex-wrap">
                <span className="text-[0.8125rem] text-[var(--text-muted)] whitespace-nowrap">{t('identity.isPermanent')}</span>
                <button
                  type="button"
                  className={cn(dangerBtnBase, 'bg-[rgba(237,62,62,0.15)] border border-[rgba(237,62,62,0.4)] text-[var(--accent-red-bright)] hover:bg-[rgba(237,62,62,0.25)]')}
                  onClick={() => { onDelete?.(); setDeleteConfirm(false) }}
                >
                  {t('identity.deleteForever')}
                </button>
                <button
                  type="button"
                  className={cn(dangerBtnBase, '!px-4 bg-transparent border border-[var(--border)] text-[var(--text-muted)] font-medium hover:bg-white/[0.04] hover:text-[var(--text-primary)]')}
                  onClick={() => setDeleteConfirm(false)}
                >
                  {t('common:action.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={cn(dangerBtnBase, 'bg-transparent border border-[rgba(237,62,62,0.3)] text-[var(--accent-red)] hover:bg-[rgba(237,62,62,0.08)] hover:border-[rgba(237,62,62,0.5)]')}
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
