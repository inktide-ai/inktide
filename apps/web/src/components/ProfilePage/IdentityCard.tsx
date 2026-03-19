import { useCallback, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCardAvatar } from '../../api/soul'
import styles from './IdentityCard.module.css'
import type { AiCharacter } from './types'
import { BANNER_PRESETS, getBannerGradient } from './bannerPresets'

interface IdentityCardProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  onDelete?: () => void
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

const IdentityCard = ({ character, onUpdate, onDelete }: IdentityCardProps) => {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const bannerIdx = character.bannerColorIndex ?? 0
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

  return (
    <div className={styles.root}>
      <div className={styles.profileCard}>
        <div
          className={styles.banner}
          style={{ background: getBannerGradient(bannerIdx) }}
        >
          <div className={styles.bannerActions}>
            {BANNER_PRESETS.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.bannerDot} ${i === bannerIdx ? styles.bannerDotActive : ''}`}
                style={{ background: i === bannerIdx ? '#fff' : 'rgba(255,255,255,0.3)' }}
                onClick={() => onUpdate({ bannerColorIndex: i })}
                aria-label={`Banner preset ${i + 1}`}
              />
            ))}
          </div>
        </div>

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
                <div className={styles.avatar} style={{ background: getBannerGradient(bannerIdx) }}>
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
              <span className={styles.badge}>Bot</span>
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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Connections</div>
        <div className={styles.infoCard}>
          <ConnectionRow icon="🎮" name="Twitch Integration" value="Connected · @chimera_bot" />
          <ConnectionRow icon="💬" name="Chat Bridge" value="Active · 3 channels" />
          <ConnectionRow icon="🔔" name="Event Triggers" value="12 rules configured" isLast />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Recent Activity</div>
        <div className={styles.infoCard}>
          <ActivityRow time="2 min ago" text="Responded to 14 chat messages during stream" />
          <ActivityRow time="1 hr ago" text="Memory updated: viewer preference for dark humor noted" />
          <ActivityRow time="3 hr ago" text="Voice synthesis used 47 times, avg latency 320ms" />
          <ActivityRow time="Yesterday" text="Personality drift detected — auto-correction applied" isLast />
        </div>
      </div>

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

interface ConnectionRowProps {
  icon: string
  name: string
  value: string
  isLast?: boolean
}

const ConnectionRow = ({ icon, name, value, isLast }: ConnectionRowProps) => (
  <div className={`${styles.infoRow} ${isLast ? styles.infoRowLast : ''}`}>
    <div className={styles.infoLeft}>
      <div className={styles.connectionIcon}>{icon}</div>
      <div>
        <div className={styles.infoLabel}>{name}</div>
        <div className={styles.infoValue}>{value}</div>
      </div>
    </div>
    <div className={styles.connectionStatus} />
  </div>
)

interface ActivityRowProps {
  time: string
  text: string
  isLast?: boolean
}

const ActivityRow = ({ time, text, isLast }: ActivityRowProps) => (
  <div className={`${styles.activityRow} ${isLast ? styles.infoRowLast : ''}`}>
    <div className={styles.activityTime}>{time}</div>
    <div className={styles.activityText}>{text}</div>
  </div>
)

export default IdentityCard
