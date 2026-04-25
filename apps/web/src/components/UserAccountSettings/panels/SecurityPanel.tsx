import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { keycloak } from '../../../keycloak'
import {
  changeKcPassword,
  getKcCredentials,
  revokeAllKcSessions,
  type KcCredential,
} from '../../../api/keycloak-account'
import { deleteAccount } from '../../../api/me'
import DeleteAccountModal from '../../ProfilePage/DeleteAccountModal'
import styles from '../UserAccountSettings.module.css'

interface Props {
  onDirty: (dirty: boolean) => void
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>
  onCancelRef: React.MutableRefObject<(() => void) | null>
}

function scorePassword(p: string): number {
  if (!p) return 0
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return Math.min(4, s)
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_CLASSES = [
  '',
  styles.strengthWeak,
  styles.strengthFair,
  styles.strengthGood,
  styles.strengthGood,
]

export default function SecurityPanel({ onDirty, saveRef, onCancelRef }: Props) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState<string | null>(null)

  const [credentials, setCredentials] = useState<KcCredential[]>([])
  const [credsLoading, setCredsLoading] = useState(true)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getKcCredentials()
      .then((c) => { if (!cancelled) setCredentials(c) })
      .catch(() => { /* non-critical */ })
      .finally(() => { if (!cancelled) setCredsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const dirty = currentPw !== '' || newPw !== '' || confirmPw !== ''
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])

  useEffect(() => {
    saveRef.current = async () => {
      setPwError(null)
      if (!currentPw || !newPw) throw new Error('Fill in current and new password')
      if (newPw !== confirmPw) throw new Error('Passwords do not match')
      if (newPw.length < 8) throw new Error('New password must be at least 8 characters')
      await changeKcPassword(currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      onDirty(false)
    }
    onCancelRef.current = () => {
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwError(null)
      onDirty(false)
    }
  })

  const handleRevokeAll = useCallback(async () => {
    await revokeAllKcSessions()
    logout()
    navigate('/')
  }, [logout, navigate])

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteAccount()
      setDeleteOpen(false)
      logout()
      navigate('/')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete account')
    } finally {
      setIsDeleting(false)
    }
  }, [logout, navigate])

  const score = scorePassword(newPw)
  const hasTOTP = credentials.some((c) => c.type === 'otp' || c.type === 'totp')
  const hasPassword = credentials.some((c) => c.type === 'password')

  function handleSetupTOTP() {
    keycloak.login({ action: 'CONFIGURE_TOTP' })
  }

  return (
    <>
      {/* Password */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconPurple}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Password</span>
          {!hasPassword && !credsLoading && (
            <span className={`${styles.badge} ${styles.badgeWarn}`} style={{ marginLeft: 'auto' }}>
              SSO — no password set
            </span>
          )}
        </div>
        <div className={styles.cardBody}>
          {pwError && <div className={styles.errorBanner}>{pwError}</div>}
          <div className={styles.formGridFull}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Current password</div>
              <input
                className={styles.fieldInput}
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
          </div>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>New password</div>
              <input
                className={styles.fieldInput}
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete="new-password"
              />
            </div>
            <div className={styles.field}>
              <div className={styles.fieldLabel}>Confirm new password</div>
              <input
                className={styles.fieldInput}
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </div>
          </div>
          {newPw && (
            <div className={styles.formGridFull}>
              <div>
                <div className={styles.strengthBar}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`${styles.strengthSegment} ${i <= score ? STRENGTH_CLASSES[score] : ''}`}
                    />
                  ))}
                </div>
                <div className={styles.strengthLabel}>
                  Password strength: {STRENGTH_LABELS[score] || '—'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2FA */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Two-factor authentication</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mfaRow}>
            <div className={styles.mfaLeft}>
              <div className={`${styles.mfaIcon} ${styles.mfaIconPurple}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="5" y="2" width="14" height="20" rx="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <div>
                <div className={styles.mfaName}>Authenticator app</div>
                <div className={styles.mfaSub}>TOTP via Google Auth or similar</div>
              </div>
            </div>
            {credsLoading
              ? <button className={`${styles.btnSm} ${styles.btnGhost}`} disabled>…</button>
              : hasTOTP
                ? <button className={`${styles.btnSm} ${styles.btnGreen}`} disabled>Enabled</button>
                : <button className={`${styles.btnSm} ${styles.btnBlue}`} onClick={handleSetupTOTP}>Set up</button>
            }
          </div>
          <div className={styles.mfaRow}>
            <div className={styles.mfaLeft}>
              <div className={`${styles.mfaIcon} ${styles.mfaIconBlue}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <div className={styles.mfaName}>Email OTP</div>
                <div className={styles.mfaSub}>One-time codes to your email</div>
              </div>
            </div>
            <button className={`${styles.btnSm} ${styles.btnGhost}`} disabled>Coming soon</button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconRed}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Danger zone</span>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowLabel}>Revoke all sessions</div>
              <div className={styles.dangerRowSub}>Log out from all devices immediately</div>
            </div>
            <button
              className={`${styles.btnSm} ${styles.btnRed}`}
              onClick={() => void handleRevokeAll()}
            >
              Revoke all
            </button>
          </div>
          <div className={styles.dangerRow}>
            <div>
              <div className={styles.dangerRowLabel}>Delete account</div>
              <div className={styles.dangerRowSub}>Permanently remove your account and all data</div>
            </div>
            <button
              className={`${styles.btnSm} ${styles.btnRed}`}
              onClick={() => { setDeleteError(null); setDeleteOpen(true) }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => { setDeleteOpen(false); setDeleteError(null) }}
          onConfirm={() => void handleDeleteConfirm()}
        />
      )}
    </>
  )
}
