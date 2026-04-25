import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { uploadCardAvatar, type ChannelResponse } from '../../api/soul'
import styles from './IdentityCard.module.css'
import type { AiCharacter } from '../../domain/character'
import { getBannerAccent, getBannerStyle } from './bannerPresets'
import brainIllustration from '../../assets/illustrations/brain.png'
import voiceIllustration from '../../assets/illustrations/voice.png'
import visionIllustration from '../../assets/illustrations/vision.webp'
import claudeCodeSvg from '../../assets/providers/brain/anthropic.svg'
import chatgptSvg from '../../assets/providers/brain/chatgpt.svg'
import elevenlabsSvg from '../../assets/providers/voice/profile/elevenlabs-identity.svg'
import ollamaSvg from '../../assets/providers/brain/ollama.svg'
import kokoroPng from '../../assets/providers/voice/profile/kokoro.svg'

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
    case 'claude': return <img src={claudeCodeSvg} style={s} alt="" />
    case 'openai': return <img src={chatgptSvg} style={s} alt="" />
    default: return <img src={ollamaSvg} style={s} alt="" />
  }
}

function getVoiceLogo(providerId: string | null): ReactNode {
  const s: React.CSSProperties = { width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }
  switch ((providerId ?? '').toLowerCase()) {
    case 'elevenlabs': return <img src={elevenlabsSvg} style={s} alt="" />
    case 'kokoro': return <img src={kokoroPng} style={s} alt="" />
    default: return <img src={kokoroPng} style={s} alt="" />
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
    <div className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`}>
      <span className={styles.toggleThumb} />
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
  const navigate = useNavigate()
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
    <div className={styles.root}>
      {/* ── Profile card ── */}
      <div className={styles.profileCard}>
        <div
          className={styles.banner}
          style={
            character.appearance.bannerImageUrl
              ? { backgroundImage: `url(${character.appearance.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: bannerStyle }
          }
        />

        <div className={styles.profileBody}>
          <div className={styles.avatarWrap}>
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              aria-label={t('edit.avatar.changeAriaLabel')}
            >
              {character.appearance.avatarUrl ? (
                <img src={character.appearance.avatarUrl} alt="" className={styles.avatarImg} />
              ) : (
                <div className={styles.avatar} style={{ background: bannerStyle }}>
                  {initial}
                </div>
              )}
              <span className={styles.avatarEditOverlay}>
                {avatarBusy ? '…' : <PencilIcon />}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFile}
              onChange={onAvatarFile}
            />
            {character.isActive && <span className={styles.onlineDot} />}
          </div>

          <div className={styles.profileMeta}>
            <div className={styles.profileName}>{character.name}</div>
            <div className={styles.profileSlug}>/{character.slug}</div>
            <div className={styles.profileBadges}>
              <span
                className={styles.badge}
                style={{ background: `${accentColor}30`, color: accentColor }}
              >{t('common:badge.bot')}</span>
              {character.tts.providerId && character.tts.providerId !== 'none' && <span className={`${styles.badge} ${styles.badgePurple}`}>TTS</span>}
              {character.memory.enabled && <span className={`${styles.badge} ${styles.badgeCyan}`}>Memory</span>}
            </div>
          </div>

          <button
            type="button"
            className={styles.editProfileBtn}
            onClick={() => navigate(`/home/bot/${character.id}/edit`)}
          >
            {t('identity.editCharacter')}
          </button>
        </div>

        {character.personality ? (
          <div className={styles.aboutTeaser}>
            <div className={styles.aboutLabel}>{t('identity.about')}</div>
            <p className={styles.aboutTeaserText}>
              {character.personality.length > 160
                ? `${character.personality.slice(0, 160)}…`
                : character.personality}
            </p>
          </div>
        ) : null}
      </div>

      {/* ── Status ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('identity.status')}</div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('identity.language')}</div>
            <div className={styles.statValue}>{character.behavior.language.toUpperCase()}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('identity.visibility')}</div>
            <div className={styles.statValue} style={{ textTransform: 'capitalize' }}>{character.visibility}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('identity.autoPilot')}</div>
            <div className={`${styles.statValue} ${character.autoPilot.enabled ? styles.statValueOn : styles.statValueOff}`}>
              {character.autoPilot.enabled ? t('common:badge.on') : t('common:badge.off')}
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('identity.autoModerate')}</div>
            <div className={`${styles.statValue} ${character.behavior.autoModerate ? styles.statValueOn : styles.statValueOff}`}>
              {character.behavior.autoModerate ? t('common:badge.on') : t('common:badge.off')}
            </div>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('identity.services')}</div>
        <div className={styles.servicesGrid}>

          {/* Brain AI */}
          <div className={`${styles.serviceCard} ${styles.serviceCardBrain}`}>
            <div className={styles.serviceCardTop}>
              {getBrainLogo(character.llm.providerId)}
              <div>
                <div className={styles.serviceCardTitle}>{t('identity.brainAI')}</div>
                <div className={styles.serviceCardSub}>{formatLlmProvider(character.llm.providerId, character.llm.modelId, t('identity.notConfigured'))}</div>
              </div>
            </div>
            <img src={brainIllustration} className={styles.serviceIllustration} alt="" aria-hidden />
            <div className={styles.serviceCardBottom}>
              <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('brain')}>{t('identity.configure')}</button>
              <Toggle on={!!character.llm.providerId} />
            </div>
          </div>

          {/* Voice AI */}
          <div className={`${styles.serviceCard} ${styles.serviceCardVoice}`}>
            <div className={styles.serviceCardTop}>
              {getVoiceLogo(character.tts.providerId)}
              <div>
                <div className={styles.serviceCardTitle}>{t('identity.voiceAI')}</div>
                <div className={styles.serviceCardSub}>{formatTtsProvider(character.tts.providerId, t('identity.notConfigured'))}</div>
              </div>
            </div>
            <img src={voiceIllustration} className={styles.serviceIllustration} alt="" aria-hidden />
            <div className={styles.serviceCardBottom}>
              <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('voice')}>{t('identity.configure')}</button>
              <Toggle on={!!character.tts.providerId && character.tts.providerId !== 'none'} />
            </div>
          </div>

          {/* Vision AI */}
          <div className={`${styles.serviceCard} ${styles.serviceCardVision}`}>
            <div className={styles.serviceCardTop}>
              <img src={chatgptSvg} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }} alt="" />
              <div>
                <div className={styles.serviceCardTitle}>{t('identity.visionAI')}</div>
                <div className={styles.serviceCardSub}>{t('identity.notConfigured')}</div>
              </div>
            </div>
            <img src={visionIllustration} className={styles.serviceIllustration} alt="" aria-hidden />
            <div className={styles.serviceCardBottom}>
              <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('skills')}>{t('identity.configure')}</button>
              <Toggle on={false} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Listening ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('identity.listening')}</div>
        <div className={styles.listeningGrid}>

          {(['discord', 'twitch'] as const).map((platform) => {
            const allChannels = getChannelsForPlatform(platform)
            const activeChannels = allChannels.filter(ch => ch.is_active)
            const isActive = activeChannels.length > 0
            const displayChannel = activeChannels[0] ?? allChannels[0]

            return (
              <div key={platform} className={styles.listeningCard}>
                <div className={styles.listeningCardTop}>
                  <div className={`${styles.listeningLogoBox} ${platform === 'discord' ? styles.listeningLogoDiscord : styles.listeningLogoTwitch}`}>
                    {platform === 'discord' ? <DiscordIcon /> : <TwitchIcon />}
                  </div>
                  <div>
                    <div className={styles.listeningCardTitle}>{platform === 'discord' ? 'Discord' : 'Twitch'}</div>
                    {displayChannel ? (
                      <div className={`${styles.listeningCardSub} ${isActive ? styles.listeningCardSubActive : ''}`}>
                        {platform === 'discord'
                          ? `#${displayChannel.channel_name}`
                          : displayChannel.channel_name}
                      </div>
                    ) : (
                      <div className={styles.listeningCardSub}>{t('identity.notConnected')}</div>
                    )}
                  </div>
                </div>
                <div className={styles.listeningCardBottom}>
                  <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('connection')}>{t('identity.configure')}</button>
                  <Toggle on={isActive} />
                </div>
              </div>
            )
          })}

          <button type="button" className={styles.addChannelCard} onClick={() => onNavigateTab?.('connection')}>
            <div className={styles.addChannelPlus}>+</div>
            <span className={styles.addChannelLabel}>{t('identity.addChannel')}</span>
          </button>

        </div>
      </div>

      {/* ── Account Management ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t('identity.accountManagement')}</div>
        <div className={styles.dangerCard}>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowTitle}>
                {character.isActive ? t('identity.deactivate') : t('identity.activate')}
              </div>
              <div className={styles.dangerRowDesc}>
                {character.isActive ? t('identity.deactivateDesc') : t('identity.activateDesc')}
              </div>
            </div>
            {deactivateConfirm ? (
              <div className={styles.confirmGroup}>
                <span className={styles.confirmText}>{t('identity.areYouSure')}</span>
                <button
                  type="button"
                  className={styles.btnDeactivate}
                  onClick={() => {
                    onUpdate({ isActive: !character.isActive })
                    setDeactivateConfirm(false)
                  }}
                >
                  {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setDeactivateConfirm(false)}
                >
                  {t('common:action.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={character.isActive ? styles.btnDeactivate : styles.btnActivate}
                onClick={() => setDeactivateConfirm(true)}
              >
                {character.isActive ? t('identity.deactivateBtn') : t('identity.activateBtn')}
              </button>
            )}
          </div>

          <div className={styles.dangerDivider} />

          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowTitle}>{t('identity.deleteCharacter')}</div>
              <div className={styles.dangerRowDesc}>{t('identity.deleteDesc')}</div>
            </div>
            {deleteConfirm ? (
              <div className={styles.confirmGroup}>
                <span className={styles.confirmText}>{t('identity.isPermanent')}</span>
                <button
                  type="button"
                  className={styles.btnDelete}
                  onClick={() => {
                    onDelete?.()
                    setDeleteConfirm(false)
                  }}
                >
                  {t('identity.deleteForever')}
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setDeleteConfirm(false)}
                >
                  {t('common:action.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.btnDeleteGhost}
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
