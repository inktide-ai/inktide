import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getStorageStatus, patchAvatar, uploadProfileFile } from '../../api/me'
import type { AiCardListItem } from '../../api/soul'
import { MAX_NICKNAME_LEN } from '../../utils/profileStorage'
import { getBannerAccent, getBannerGradient } from './bannerPresets'
import type { AiCharacter } from './types'
import styles from './AccountAvatarPanel.module.css'

function getInitialLetter(userName: string | undefined): string {
  const u = userName?.trim() ?? ''
  if (!u) return '?'
  const ch = u.replace(/^\./, '').charAt(0)
  return ch ? ch.toUpperCase() : '?'
}

function truncateText(s: string, max: number): string {
  const t = s.trim()
  if (!t.length) return ''
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export interface AccountAvatarPanelProps {
  onBack: () => void
  projects: AiCardListItem[]
  characters: Map<string, AiCharacter>
  onSelectProject: (id: string) => void
}

export default function AccountAvatarPanel({
  onBack,
  projects,
  characters,
  onSelectProject,
}: AccountAvatarPanelProps) {
  const { user, refreshSession, setNickname } = useAuth()
  const [storageEnabled, setStorageEnabled] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [nickDraft, setNickDraft] = useState('')
  const [nickSaved, setNickSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNickDraft(user?.nickname ?? '')
  }, [user?.userId, user?.nickname])

  useEffect(() => {
    let cancelled = false
    getStorageStatus()
      .then((s) => {
        if (!cancelled) setStorageEnabled(s.enabled)
      })
      .catch(() => {
        if (!cancelled) setStorageEnabled(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const displayUrl = localPreview ?? user?.pictureUrl ?? null
  const initial = getInitialLetter(user?.nickname ?? user?.userName)

  const saveNickname = useCallback(() => {
    setNickname(nickDraft)
    setNickSaved(true)
    window.setTimeout(() => setNickSaved(false), 2000)
  }, [nickDraft, setNickname])

  const onFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.')
        return
      }
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview(blobUrl)
      setBusy(true)
      try {
        const { key } = await uploadProfileFile(file)
        await patchAvatar(key)
        await refreshSession()
        setLocalPreview(null)
      } catch (err) {
        setLocalPreview(null)
        setError(err instanceof Error ? err.message : 'Could not update avatar')
      } finally {
        URL.revokeObjectURL(blobUrl)
        setBusy(false)
      }
    },
    [refreshSession],
  )

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backBtn} onClick={onBack}>
        ← Back to workshop
      </button>

      <section className={styles.profileCard} aria-labelledby="account-profile-title">
        <header className={styles.profileCardHeader}>
          <h1 id="account-profile-title" className={styles.cardTitle}>
            Your profile
          </h1>
          <p className={styles.cardLead}>
            Account identity: display name and photo. Bots are configured separately — see Projects
            below.
          </p>
        </header>

        <div className={styles.profileCardBody}>
          <div className={styles.avatarColumn}>
            <div className={styles.previewWrap}>
              {displayUrl ? (
                <img src={displayUrl} alt="" className={styles.previewImg} />
              ) : (
                <div className={styles.previewFallback} aria-hidden>
                  {initial}
                </div>
              )}
              {busy && <div className={styles.busyOverlay}>Updating…</div>}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={onFileChange}
              disabled={busy || storageEnabled === false}
            />

            <button
              type="button"
              className={styles.primaryBtn}
              disabled={busy || storageEnabled === false}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? 'Working…' : 'Upload new photo'}
            </button>
            <p className={styles.photoHint}>PNG, JPG, WebP — up to ~50 MB.</p>
          </div>

          <div className={styles.formColumn}>
            <div className={styles.fieldBlock}>
              <label className={styles.fieldLabel} htmlFor="profile-display-name-input">
                Display name
              </label>
              <p className={styles.fieldDescription}>
                Shown in the sidebar instead of your login handle. Stored in this browser until
                Keycloak stores it.
              </p>
              <div className={styles.nickRow}>
                <input
                  id="profile-display-name-input"
                  className={styles.nickInput}
                  type="text"
                  maxLength={MAX_NICKNAME_LEN}
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  placeholder={user?.userName ?? 'Nickname'}
                  disabled={busy}
                  autoComplete="nickname"
                />
                <button type="button" className={styles.nickSave} onClick={saveNickname} disabled={busy}>
                  Save
                </button>
              </div>
              {nickSaved && (
                <p className={styles.nickSaved} role="status">
                  Saved
                </p>
              )}
            </div>

            {storageEnabled === false && (
              <div className={styles.warn} role="status">
                File storage is not configured on the server — avatar upload is unavailable.
              </div>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={styles.projectsSection} aria-labelledby="projects-heading">
        <div className={styles.projectsHead}>
          <span className={styles.projectsIconWrap} aria-hidden>
            <svg className={styles.projectsIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M19 14L19.8 17.2L23 18L19.8 18.8L19 22L18.2 18.8L15 18L18.2 17.2L19 14Z"
                fill="currentColor"
                opacity="0.55"
              />
            </svg>
          </span>
          <div>
            <h2 id="projects-heading" className={styles.projectsTitle}>
              Projects
            </h2>
            <p className={styles.projectsSubtitle}>
              Each project is a bot — identity, skills, voice, and model. Open one to edit in the
              workshop.
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className={styles.projectsEmpty}>
            <p>No projects yet.</p>
            <p className={styles.projectsEmptyHint}>
              Use <strong>Create new</strong> in the sidebar to add your first bot.
            </p>
          </div>
        ) : (
          <ul className={styles.projectGrid}>
            {projects.map((c) => {
              const char = characters.get(c.id)
              const bannerIdx = char?.bannerColorIndex ?? 0
              const accent = getBannerAccent(bannerIdx)
              const desc = truncateText(c.personality, 140)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={styles.projectCard}
                    onClick={() => onSelectProject(c.id)}
                  >
                    <div className={styles.projectCardIcon}>
                      <div
                        className={styles.projectCardIconInner}
                        style={c.avatar_url ? undefined : { background: getBannerGradient(bannerIdx) }}
                      >
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" className={styles.projectCardIconImg} />
                        ) : (
                          <span className={styles.projectCardLetter}>{c.name.charAt(0)}</span>
                        )}
                      </div>
                      {c.is_active && (
                        <span className={styles.projectCardStatus} title="Active" aria-hidden />
                      )}
                    </div>
                    <div className={styles.projectCardContent}>
                      <div className={styles.projectCardTop}>
                        <h3 className={styles.projectCardTitle}>{c.name}</h3>
                        <span
                          className={styles.projectCardBadge}
                          style={{
                            background: `${accent}22`,
                            color: accent,
                          }}
                        >
                          Bot
                        </span>
                      </div>
                      <p className={styles.projectCardSlug}>/{c.slug}</p>
                      {desc ? (
                        <p className={styles.projectCardDesc}>{desc}</p>
                      ) : (
                        <p className={styles.projectCardDescMuted}>No description yet</p>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
