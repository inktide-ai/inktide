'use client'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import styles from '../UserAccountSettings.module.css'

const STORAGE_KEY = 'inktide_user_appearance'

interface AppearancePrefs {
  theme: 'dark' | 'light' | 'system'
  accentColor: string
  font: 'system' | 'inter' | 'geist'
  compact: boolean
  reduceMotion: boolean
}

const DEFAULT_PREFS: AppearancePrefs = {
  theme: 'dark',
  accentColor: '#6c47ff',
  font: 'system',
  compact: false,
  reduceMotion: false,
}

const ACCENT_COLORS = ['#6c47ff', '#1D9E75', '#378ADD', '#D85A30', '#D4537E', '#EF9F27']
const ACCENT_NAMES: Record<string, string> = {
  '#6c47ff': 'Purple',
  '#1D9E75': 'Green',
  '#378ADD': 'Blue',
  '#D85A30': 'Orange',
  '#D4537E': 'Pink',
  '#EF9F27': 'Amber',
}

function loadPrefs(): AppearancePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) as Partial<AppearancePrefs> }
  } catch { return DEFAULT_PREFS }
}

function savePrefs(p: AppearancePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

interface Props {
  onDirty: (dirty: boolean) => void
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>
  onCancelRef: React.MutableRefObject<(() => void) | null>
}

export default function AppearancePanel({ onDirty, saveRef, onCancelRef }: Props) {
  const { setTheme } = useTheme()
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_PREFS)

  useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  function update<K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value }
      savePrefs(next)
      if (key === 'theme') setTheme(value as string)
      return next
    })
  }

  useEffect(() => { onDirty(false) }, [onDirty])
  useEffect(() => {
    saveRef.current = async () => { /* already saved on change */ }
    onCancelRef.current = () => { /* nothing */ }
  })

  return (
    <>
      {/* Theme */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconAmber}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="5"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Theme</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.themeGrid}>
            {(['dark', 'light', 'system'] as const).map((t) => (
              <button
                key={t}
                className={`${styles.themeOpt} ${prefs.theme === t ? styles.themeOptSelected : ''}`}
                onClick={() => update('theme', t)}
              >
                <div className={`${styles.themePreview} ${
                  t === 'dark' ? styles.themePreviewDark :
                  t === 'light' ? styles.themePreviewLight :
                  styles.themePreviewAuto
                }`} />
                <div className={styles.themeLabel}>{t.charAt(0).toUpperCase() + t.slice(1)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accent color */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="13.5" cy="6.5" r="2.5"/>
              <circle cx="17.5" cy="10.5" r="2.5"/>
              <circle cx="8.5" cy="7.5" r="2.5"/>
              <circle cx="6.5" cy="12.5" r="2.5"/>
              <path d="M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12c0 2.58.97 4.93 2.56 6.71L12 22z"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Accent color</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.accentRow}>
            {ACCENT_COLORS.map((c) => (
              <button
                key={c}
                className={`${styles.accentDot} ${prefs.accentColor === c ? styles.accentDotSelected : ''}`}
                style={{ background: c }}
                title={ACCENT_NAMES[c]}
                onClick={() => update('accentColor', c)}
              />
            ))}
          </div>
          <div className={styles.fieldHint}>Currently: {ACCENT_NAMES[prefs.accentColor] ?? prefs.accentColor}</div>
        </div>
      </div>

      {/* Font & density */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="4 7 4 4 20 4 20 7"/>
              <line x1="9" y1="20" x2="15" y2="20"/>
              <line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Font &amp; density</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.field} style={{ marginBottom: 12 }}>
            <div className={styles.fieldLabel} style={{ marginBottom: 6 }}>Interface font</div>
            <div className={styles.fontRow}>
              {(['system', 'inter', 'geist'] as const).map((f) => (
                <button
                  key={f}
                  className={`${styles.fontOpt} ${prefs.font === f ? styles.fontOptSelected : ''}`}
                  onClick={() => update('font', f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Compact mode</div>
              <div className={styles.toggleSub}>Reduce spacing and element sizes</div>
            </div>
            <button
              className={`${styles.toggle} ${prefs.compact ? styles.toggleOn : ''}`}
              onClick={() => update('compact', !prefs.compact)}
            >
              <div className={styles.toggleDot} />
            </button>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Reduce motion</div>
              <div className={styles.toggleSub}>Minimize animations</div>
            </div>
            <button
              className={`${styles.toggle} ${prefs.reduceMotion ? styles.toggleOn : ''}`}
              onClick={() => update('reduceMotion', !prefs.reduceMotion)}
            >
              <div className={styles.toggleDot} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
