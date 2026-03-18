import { useState, useRef } from 'react'
import styles from '../ProfilePage.module.css'

const THEME_COLORS = [
  { name: 'Chimera Red', value: '#ED3E3E' },
  { name: 'Neon Purple', value: '#8B5CF6' },
  { name: 'Cyber Cyan', value: '#22D3EE' },
  { name: 'Hot Pink', value: '#EC4899' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
]

const AppearanceTab = () => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState('#ED3E3E')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarUrl(url)
  }

  return (
    <div className={styles.cardsGrid}>
      <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPink}`}>✨</div>
          <div>
            <div className={styles.cardTitle}>Avatar</div>
            <div className={styles.cardDescription}>Your AI's profile picture</div>
          </div>
        </div>

        <div className={styles.avatarUpload}>
          <div className={styles.avatarPreview}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" />
            ) : (
              '🤖'
            )}
          </div>
          <div className={styles.avatarActions}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={() => fileRef.current?.click()}
            >
              Upload Image
            </button>
            {avatarUrl && (
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => setAvatarUrl(null)}
              >
                Remove
              </button>
            )}
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              PNG, JPG or GIF · Max 2 MB
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconGold}`}>🏷️</div>
          <div>
            <div className={styles.cardTitle}>Identity</div>
            <div className={styles.cardDescription}>Public-facing info</div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Display Name</label>
          <input
            className={styles.input}
            placeholder="How your AI appears to viewers"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Bio</label>
          <textarea
            className={styles.textarea}
            placeholder="A short bio shown on your AI's profile..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>🎨</div>
          <div>
            <div className={styles.cardTitle}>Accent Color</div>
            <div className={styles.cardDescription}>Theme color for your AI's chat overlay</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {THEME_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setAccentColor(c.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: accentColor === c.value ? 'rgba(255,255,255,0.06)' : 'transparent',
                border: accentColor === c.value ? `1px solid ${c.value}` : '1px solid var(--border)',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: c.value,
                  flexShrink: 0,
                  boxShadow: accentColor === c.value ? `0 0 8px ${c.value}60` : 'none',
                }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                {c.name}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <label className={styles.label}>Custom Color</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              style={{
                width: 36,
                height: 36,
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                background: 'transparent',
              }}
            />
            <input
              className={styles.input}
              style={{ fontFamily: 'var(--font-mono)', maxWidth: 120 }}
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppearanceTab
