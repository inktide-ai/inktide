'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { getKcProfile, updateKcProfile, type KcAccountProfile } from '../../../api/keycloak-account'
import styles from '../UserAccountSettings.module.css'

interface Props {
  onDirty: (dirty: boolean) => void
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>
  onCancelRef: React.MutableRefObject<(() => void) | null>
}

export default function ProfilePanel({ onDirty, saveRef, onCancelRef }: Props) {
  const { user, userEmail } = useAuth()

  const [original, setOriginal] = useState<KcAccountProfile | null>(null)
  const [draft, setDraft] = useState<KcAccountProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getKcProfile()
      .then((p) => {
        if (cancelled) return
        setOriginal(p)
        setDraft(p)
      })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load profile') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!original || !draft) { onDirty(false); return }
    const dirty =
      draft.firstName !== original.firstName ||
      draft.lastName !== original.lastName ||
      draft.email !== original.email ||
      (draft.attributes?.bio?.[0] ?? '') !== (original.attributes?.bio?.[0] ?? '')
    onDirty(dirty)
  }, [draft, original, onDirty])

  useEffect(() => {
    saveRef.current = async () => {
      if (!draft) return
      setError(null)
      await updateKcProfile(draft)
      setOriginal(draft)
      onDirty(false)
    }
    onCancelRef.current = () => {
      setDraft(original)
      onDirty(false)
    }
  })

  function set(key: keyof KcAccountProfile, value: string) {
    setDraft((d) => d ? { ...d, [key]: value } : d)
  }

  function setBio(value: string) {
    setDraft((d) => d ? { ...d, attributes: { ...d.attributes, bio: [value] } } : d)
  }

  const initial = user?.userName?.charAt(0).toUpperCase() ?? 'U'
  const displayName = [draft?.firstName, draft?.lastName].filter(Boolean).join(' ') || draft?.username || '—'
  const memberSince = 'Member' // KC doesn't expose createdTimestamp via Account API easily
  const bio = draft?.attributes?.bio?.[0] ?? ''

  if (loading) return <div className={styles.loadingText}>Loading profile…</div>

  return (
    <>
      {/* Profile card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Profile</span>
          <span className={styles.cardMeta}>
            <span className={styles.badge} style={{ background: '#1D9E7518', color: '#1D9E75', border: '1px solid #1D9E7530' }}>Online</span>
          </span>
        </div>
        <div className={styles.cardBody}>
          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.profileAvatarRow}>
            <div className={styles.profileAvatar}>
              {user?.pictureUrl
                ? <img src={user.pictureUrl} alt="" className={styles.profileAvatarImg} />
                : initial}
            </div>
            <div className={styles.profileAvatarInfo}>
              <div className={styles.profileAvatarName}>
                {displayName}
                {draft?.username && (
                  <span className={`${styles.badge} ${styles.badgeDiscord}`} style={{ marginLeft: 6 }}>
                    {draft.username}
                  </span>
                )}
              </div>
              <div className={styles.profileAvatarMeta}>{memberSince}</div>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>
                First name <span className={styles.fieldRequired}>*</span>
              </div>
              <input
                className={styles.fieldInput}
                value={draft?.firstName ?? ''}
                onChange={(e) => set('firstName', e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>
                Last name
              </div>
              <input
                className={styles.fieldInput}
                value={draft?.lastName ?? ''}
                onChange={(e) => set('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Username</div>
              <input
                className={`${styles.fieldInput} ${styles.fieldInputMono}`}
                value={draft?.username ?? ''}
                disabled
              />
              <div className={styles.fieldHint}>Cannot be changed here</div>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Email <span className={styles.fieldRequired}>*</span></div>
              <input
                className={styles.fieldInput}
                value={draft?.email ?? userEmail ?? ''}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGridFull}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Bio</div>
              <input
                className={styles.fieldInput}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about yourself"
              />
              <div className={styles.fieldHint}>Shown on your public profile</div>
            </div>
          </div>
        </div>
      </div>

      {/* Locale card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Contact &amp; locale</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Locale</div>
              <select className={styles.fieldSelect} defaultValue="en">
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Timezone</div>
              <select className={styles.fieldSelect} defaultValue="utc3">
                <option value="utc3">UTC+3 Moscow</option>
                <option value="utc0">UTC+0 London</option>
                <option value="utcm5">UTC-5 New York</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
