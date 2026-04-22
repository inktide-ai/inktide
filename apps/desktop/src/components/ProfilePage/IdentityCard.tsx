import { useCallback, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCardAvatar } from '../../api/soul'
import styles from './IdentityCard.module.css'
import type { AiCharacter } from './types'
import { getBannerAccent, getBannerStyle } from './bannerPresets'
import brainIllustration from '../../assets/illustrations/brain.png'
import voiceIllustration from '../../assets/illustrations/voice.png'
import visionIllustration from '../../assets/illustrations/vision.webp'
import openaiSvg from '../../assets/providers/common/openai.svg'

interface IdentityCardProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  onDelete?: () => void
  onNavigateTab?: (tab: string) => void
}

function fmtProvider(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function OllamaIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 128 128" fill="none" aria-hidden>
      <path d="M64 18c-8.3 0-15 6.4-15 14.3 0 4.2 1.8 8 4.7 10.7C50 46.2 48 50.8 48 55.8c0 8.8 7.2 16 16 16s16-7.2 16-16c0-5-2-9.6-5.7-12.8 2.9-2.7 4.7-6.5 4.7-10.7C79 24.4 72.3 18 64 18z" fill="#fff" fillOpacity="0.9"/>
      <ellipse cx="64" cy="88" rx="22" ry="18" fill="#fff" fillOpacity="0.9"/>
    </svg>
  )
}

function KokoroIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M24 6C13.5 6 5 13.5 5 23c0 5.4 2.6 10.2 6.6 13.4L24 42l12.4-5.6C40.4 33.2 43 28.4 43 23 43 13.5 34.5 6 24 6z" fill="url(#kkd)"/>
      <path d="M17 24c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeOpacity="0.9"/>
      <circle cx="17" cy="24" r="2" fill="#fff" fillOpacity="0.9"/>
      <circle cx="31" cy="24" r="2" fill="#fff" fillOpacity="0.9"/>
      <defs>
        <linearGradient id="kkd" x1="5" y1="6" x2="43" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06b6d4"/>
          <stop offset="1" stopColor="#0891b2"/>
        </linearGradient>
      </defs>
    </svg>
  )
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

function getBrainLogo(_providerId?: string): ReactNode {
  return <OllamaIcon />
}

function getVoiceLogo(ttsEnabled: boolean): ReactNode {
  if (!ttsEnabled) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <path d="M2 12h2M20 12h2M6 8v8M10 5v14M14 7v10M18 9v6"/>
      </svg>
    )
  }
  return <KokoroIcon />
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`}>
      <span className={styles.toggleThumb} />
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

// ── Component ──────────────────────────────────────────────────────────────────

const IdentityCard = ({ character, onUpdate, onDelete, onNavigateTab }: IdentityCardProps) => {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const bannerIdx = character.bannerColorIndex ?? 0
  const bannerStyle = getBannerStyle(bannerIdx, character.bannerCustomColor)
  const accentColor = character.bannerCustomColor ?? getBannerAccent(bannerIdx)
  const initial = character.name.charAt(0).toUpperCase()

  const onAvatarFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file || !file.type.startsWith('image/')) return
      setAvatarBusy(true)
      try {
        const res = await uploadCardAvatar(character.id, file)
        onUpdate({ avatarUrl: res.avatar_url })
      } catch {
        /* optional toast */
      } finally {
        setAvatarBusy(false)
      }
    },
    [character.id, onUpdate],
  )

  const brainLabel = character.llmCatalogId
    ? fmtProvider(character.llmCatalogId)
    : 'Ollama'

  const voiceLabel = character.ttsEnabled
    ? (character.ttsCatalogId ? fmtProvider(character.ttsCatalogId) : 'Kokoro')
    : 'Not configured'

  return (
    <div className={styles.root}>
      {/* ── Profile card ── */}
      <div className={styles.profileCard}>
        <div
          className={styles.banner}
          style={
            character.bannerImageUrl
              ? { backgroundImage: `url(${character.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
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
              aria-label="Change avatar"
            >
              {character.avatarUrl ? (
                <img src={character.avatarUrl} alt="" className={styles.avatarImg} />
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
              >Bot</span>
              {character.ttsEnabled && <span className={`${styles.badge} ${styles.badgePurple}`}>TTS</span>}
              {character.memoryEnabled && <span className={`${styles.badge} ${styles.badgeCyan}`}>Memory</span>}
            </div>
          </div>

          <button
            type="button"
            className={styles.editProfileBtn}
            onClick={() => navigate(`/profile/bot/${character.id}/edit`)}
          >
            Edit Character
          </button>
        </div>

        {character.personality ? (
          <div className={styles.aboutTeaser}>
            <div className={styles.aboutLabel}>About</div>
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
        <div className={styles.sectionTitle}>Status</div>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{character.maxTokens}</div>
            <div className={styles.statLabel}>Max Tokens</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{character.temperature.toFixed(1)}</div>
            <div className={styles.statLabel}>Temperature</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{character.maxMemories}</div>
            <div className={styles.statLabel}>Memory Slots</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{character.responseDelayMs}ms</div>
            <div className={styles.statLabel}>Response Delay</div>
          </div>
        </div>
      </div>

      {/* ── Services ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Services</div>
        <div className={styles.servicesGrid}>

          {/* Brain AI */}
          <div className={`${styles.serviceCard} ${styles.serviceCardBrain}`}>
            <div className={styles.serviceCardTop}>
              <div className={`${styles.serviceLogoBox} ${styles.serviceLogoBoxBrain}`}>
                {getBrainLogo(character.llmCatalogId)}
              </div>
              <div>
                <div className={styles.serviceCardTitle}>Brain AI</div>
                <div className={styles.serviceCardSub}>{brainLabel}</div>
              </div>
            </div>
            <img src={brainIllustration} className={styles.serviceIllustration} alt="" aria-hidden />
            <div className={styles.serviceCardBottom}>
              <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('brain')}>Configure</button>
              <Toggle on />
            </div>
          </div>

          {/* Voice AI */}
          <div className={`${styles.serviceCard} ${styles.serviceCardVoice}`}>
            <div className={styles.serviceCardTop}>
              <div className={`${styles.serviceLogoBox} ${styles.serviceLogoBoxVoice}`}>
                {getVoiceLogo(character.ttsEnabled)}
              </div>
              <div>
                <div className={styles.serviceCardTitle}>Voice AI</div>
                <div className={styles.serviceCardSub}>{voiceLabel}</div>
              </div>
            </div>
            <img src={voiceIllustration} className={styles.serviceIllustration} alt="" aria-hidden />
            <div className={styles.serviceCardBottom}>
              <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('voice')}>Configure</button>
              <Toggle on={character.ttsEnabled} />
            </div>
          </div>

          {/* Vision AI */}
          <div className={`${styles.serviceCard} ${styles.serviceCardVision}`}>
            <div className={styles.serviceCardTop}>
              <div className={`${styles.serviceLogoBox} ${styles.serviceLogoBoxVision}`}>
                <img src={openaiSvg} style={{ width: 24, height: 24 }} alt="" />
              </div>
              <div>
                <div className={styles.serviceCardTitle}>Vision AI</div>
                <div className={styles.serviceCardSub}>Not configured</div>
              </div>
            </div>
            <img src={visionIllustration} className={styles.serviceIllustration} alt="" aria-hidden />
            <div className={styles.serviceCardBottom}>
              <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('skills')}>Configure</button>
              <Toggle on={false} />
            </div>
          </div>

        </div>
      </div>

      {/* ── Listening ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Listening</div>
        <div className={styles.listeningGrid}>

          {(['discord', 'twitch'] as const).map((platform) => (
            <div key={platform} className={styles.listeningCard}>
              <div className={styles.listeningCardTop}>
                <div className={`${styles.listeningLogoBox} ${platform === 'discord' ? styles.listeningLogoDiscord : styles.listeningLogoTwitch}`}>
                  {platform === 'discord' ? <DiscordIcon /> : <TwitchIcon />}
                </div>
                <div>
                  <div className={styles.listeningCardTitle}>{platform === 'discord' ? 'Discord' : 'Twitch'}</div>
                  <div className={styles.listeningCardSub}>Not connected</div>
                </div>
              </div>
              <div className={styles.listeningCardBottom}>
                <button type="button" className={styles.serviceConfigureBtn} onClick={() => onNavigateTab?.('connection')}>Configure</button>
                <Toggle on={false} />
              </div>
            </div>
          ))}

          <button type="button" className={styles.addChannelCard} onClick={() => onNavigateTab?.('connection')}>
            <div className={styles.addChannelPlus}>+</div>
            <span className={styles.addChannelLabel}>Add channel</span>
          </button>

        </div>
      </div>

      {/* ── Account Management ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Account Management</div>
        <div className={styles.dangerCard}>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowTitle}>
                {character.isActive ? 'Deactivate Character' : 'Activate Character'}
              </div>
              <div className={styles.dangerRowDesc}>
                {character.isActive
                  ? 'Temporarily disable this character. It will stop responding but all settings are preserved.'
                  : 'Reactivate this character. It will resume responding to chat.'}
              </div>
            </div>
            {deactivateConfirm ? (
              <div className={styles.confirmGroup}>
                <span className={styles.confirmText}>Are you sure?</span>
                <button
                  type="button"
                  className={styles.btnDeactivate}
                  onClick={() => {
                    onUpdate({ isActive: !character.isActive })
                    setDeactivateConfirm(false)
                  }}
                >
                  {character.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setDeactivateConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={character.isActive ? styles.btnDeactivate : styles.btnActivate}
                onClick={() => setDeactivateConfirm(true)}
              >
                {character.isActive ? 'Deactivate' : 'Activate'}
              </button>
            )}
          </div>

          <div className={styles.dangerDivider} />

          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowTitle}>Delete Character</div>
              <div className={styles.dangerRowDesc}>
                Permanently remove this character and all associated data. This action cannot be undone.
              </div>
            </div>
            {deleteConfirm ? (
              <div className={styles.confirmGroup}>
                <span className={styles.confirmText}>This is permanent.</span>
                <button
                  type="button"
                  className={styles.btnDelete}
                  onClick={() => {
                    onDelete?.()
                    setDeleteConfirm(false)
                  }}
                >
                  Delete Forever
                </button>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.btnDeleteGhost}
                onClick={() => setDeleteConfirm(true)}
              >
                Delete Character
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default IdentityCard
