'use client'
import { useEffect, useState } from 'react'
import styles from '../UserAccountSettings.module.css'

const STORAGE_KEY = 'inktide_user_notifications'

interface NotifPrefs {
  emailSecurity: boolean
  emailAccount: boolean
  emailProduct: boolean
  emailMarketing: boolean
  discordBotDm: boolean
  discordActivity: boolean
  discordUsage: boolean
}

const DEFAULT_PREFS: NotifPrefs = {
  emailSecurity: true,
  emailAccount: true,
  emailProduct: false,
  emailMarketing: false,
  discordBotDm: true,
  discordActivity: true,
  discordUsage: false,
}

function loadPrefs(): NotifPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) as Partial<NotifPrefs> }
  } catch { return DEFAULT_PREFS }
}

interface Props {
  onDirty: (dirty: boolean) => void
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>
  onCancelRef: React.MutableRefObject<(() => void) | null>
}

export default function NotificationsPanel({ onDirty, saveRef, onCancelRef }: Props) {
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs)

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  // Saves immediately on toggle
  useEffect(() => { onDirty(false) }, [onDirty])
  useEffect(() => {
    saveRef.current = async () => { /* already saved on change */ }
    onCancelRef.current = () => { /* nothing */ }
  })

  return (
    <>
      {/* Email */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Email notifications</span>
        </div>
        <div className={styles.cardBody}>
          {(
            [
              { key: 'emailSecurity' as const, label: 'Security alerts', sub: 'Login from new device or suspicious activity' },
              { key: 'emailAccount' as const, label: 'Account updates', sub: 'Password changes, email confirmations' },
              { key: 'emailProduct' as const, label: 'Product announcements', sub: 'New features and Inktide updates' },
              { key: 'emailMarketing' as const, label: 'Marketing emails', sub: 'Promotions and newsletters' },
            ]
          ).map(({ key, label, sub }) => (
            <div key={key} className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{label}</div>
                <div className={styles.toggleSub}>{sub}</div>
              </div>
              <button
                className={`${styles.toggle} ${prefs[key] ? styles.toggleOn : ''}`}
                onClick={() => toggle(key)}
              >
                <div className={styles.toggleDot} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Discord */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Discord notifications</span>
        </div>
        <div className={styles.cardBody}>
          {(
            [
              { key: 'discordBotDm' as const, label: 'Bot DM alerts', sub: 'Important events via Discord bot' },
              { key: 'discordActivity' as const, label: 'Character activity', sub: 'When your bot responds or errors' },
              { key: 'discordUsage' as const, label: 'Usage warnings', sub: 'API limits and quota alerts' },
            ]
          ).map(({ key, label, sub }) => (
            <div key={key} className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>{label}</div>
                <div className={styles.toggleSub}>{sub}</div>
              </div>
              <button
                className={`${styles.toggle} ${prefs[key] ? styles.toggleOn : ''}`}
                onClick={() => toggle(key)}
              >
                <div className={styles.toggleDot} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
