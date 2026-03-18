import { useState } from 'react'
import styles from './IdentityCard.module.css'
import type { AiCharacter } from './types'
import { BANNER_PRESETS, getBannerGradient } from './bannerPresets'

interface IdentityCardProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
}

const IdentityCard = ({ character, onUpdate }: IdentityCardProps) => {
  const bannerIdx = character.bannerColorIndex ?? 0
  const [editingField, setEditingField] = useState<string | null>(null)
  const [deactivateConfirm, setDeactivateConfirm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const initial = character.name.charAt(0).toUpperCase()

  return (
    <div className={styles.root}>

      {/* ── Profile Card ── */}
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
            <div
              className={styles.avatar}
              style={{ background: getBannerGradient(bannerIdx) }}
            >
              {initial}
            </div>
            {character.isActive && <span className={styles.onlineDot} />}
          </div>

          <div className={styles.profileMeta}>
            <div className={styles.profileName}>{character.name}</div>
            <div className={styles.profileSlug}>/{character.slug}</div>
            <div className={styles.profileBadges}>
              <span className={styles.badge}>BOT</span>
              {character.ttsEnabled && <span className={`${styles.badge} ${styles.badgePurple}`}>TTS</span>}
              {character.memoryEnabled && <span className={`${styles.badge} ${styles.badgeCyan}`}>MEMORY</span>}
            </div>
          </div>

          <button
            type="button"
            className={styles.editProfileBtn}
            onClick={() => setEditingField(editingField ? null : 'name')}
          >
            {editingField ? 'Done' : 'Edit Character'}
          </button>
        </div>

        {/* ── About section ── */}
        <div className={styles.aboutSection}>
          <div className={styles.aboutLabel}>About</div>
          <p className={styles.aboutText}>
            {character.personality || 'No personality defined yet. Add one to bring your character to life.'}
          </p>
        </div>
      </div>

      {/* ── Info Rows ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Character Info</div>

        <div className={styles.infoCard}>
          <InfoRow
            label="Display Name"
            value={character.name}
            editing={editingField === 'name'}
            onEdit={() => setEditingField('name')}
            onDone={() => setEditingField(null)}
            onChange={(v) => onUpdate({ name: v })}
          />
          <InfoRow
            label="Slug"
            value={character.slug}
            editing={editingField === 'slug'}
            onEdit={() => setEditingField('slug')}
            onDone={() => setEditingField(null)}
            onChange={(v) => onUpdate({ slug: v })}
            prefix="/"
          />
          <InfoRow
            label="Language"
            value={character.language.toUpperCase()}
            editing={editingField === 'lang'}
            onEdit={() => setEditingField('lang')}
            onDone={() => setEditingField(null)}
            onChange={(v) => onUpdate({ language: v })}
          />
          <InfoRow
            label="Key Phrases"
            value={character.keyPhrases}
            editing={editingField === 'phrases'}
            onEdit={() => setEditingField('phrases')}
            onDone={() => setEditingField(null)}
            onChange={(v) => onUpdate({ keyPhrases: v })}
            hint="Comma-separated"
            isLast
          />
        </div>
      </div>

      {/* ── Personality ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Personality</div>
        <div className={styles.infoCard}>
          <div className={styles.textareaRow}>
            <div className={styles.infoLabel}>Description</div>
            <textarea
              className={styles.textarea}
              value={character.personality}
              onChange={(e) => onUpdate({ personality: e.target.value })}
              placeholder="Describe your AI's personality, tone, and quirks..."
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* ── Status & Stats ── */}
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

      {/* ── Connections (lorem) ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Connections</div>
        <div className={styles.infoCard}>
          <ConnectionRow icon="🎮" name="Twitch Integration" value="Connected · @chimera_bot" />
          <ConnectionRow icon="💬" name="Chat Bridge" value="Active · 3 channels" />
          <ConnectionRow icon="🔔" name="Event Triggers" value="12 rules configured" isLast />
        </div>
      </div>

      {/* ── Activity (lorem) ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Recent Activity</div>
        <div className={styles.infoCard}>
          <ActivityRow time="2 min ago" text="Responded to 14 chat messages during stream" />
          <ActivityRow time="1 hr ago" text="Memory updated: viewer preference for dark humor noted" />
          <ActivityRow time="3 hr ago" text="Voice synthesis used 47 times, avg latency 320ms" />
          <ActivityRow time="Yesterday" text="Personality drift detected — auto-correction applied" isLast />
        </div>
      </div>

      {/* ── Danger Zone ── */}
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
                  onClick={() => { onUpdate({ isActive: !character.isActive }); setDeactivateConfirm(false) }}
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
                <button type="button" className={styles.btnDelete}>
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

// ── Sub-components ──

interface InfoRowProps {
  label: string
  value: string
  editing: boolean
  onEdit: () => void
  onDone: () => void
  onChange: (v: string) => void
  prefix?: string
  hint?: string
  isLast?: boolean
}

const InfoRow = ({ label, value, editing, onEdit, onDone, onChange, prefix, hint, isLast }: InfoRowProps) => (
  <div className={`${styles.infoRow} ${isLast ? styles.infoRowLast : ''}`}>
    <div className={styles.infoLeft}>
      <div className={styles.infoLabel}>{label}</div>
      {editing ? (
        <input
          className={styles.inlineInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onDone}
          autoFocus
        />
      ) : (
        <div className={styles.infoValue}>
          {prefix && <span className={styles.infoPrefix}>{prefix}</span>}
          {value || <span className={styles.infoEmpty}>Not set</span>}
          {hint && <span className={styles.infoHint}> · {hint}</span>}
        </div>
      )}
    </div>
    <button type="button" className={styles.editBtn} onClick={editing ? onDone : onEdit}>
      {editing ? 'Save' : 'Edit'}
    </button>
  </div>
)

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
