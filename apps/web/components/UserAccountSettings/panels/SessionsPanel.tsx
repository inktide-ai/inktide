'use client'
import { useEffect, useState } from 'react'
import { getKcSessions, revokeKcSession, type KcSession } from '../../../api/keycloak-account'
import styles from '../UserAccountSettings.module.css'

interface Props {
  onDirty: (dirty: boolean) => void
  saveRef: React.MutableRefObject<(() => Promise<void>) | null>
  onCancelRef: React.MutableRefObject<(() => void) | null>
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts * 1000
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Active now'
  if (mins < 60) return `${mins} minutes ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function getBrowserName(ua?: string): string {
  if (!ua) return 'Unknown browser'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return ua
}

function getOsName(sess: KcSession): string {
  const os = sess.os ?? ''
  const osVer = sess.osVersion ? ` ${sess.osVersion}` : ''
  if (os) return `${os}${osVer}`
  return 'Unknown OS'
}

export default function SessionsPanel({ onDirty, saveRef, onCancelRef }: Props) {
  const [sessions, setSessions] = useState<KcSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    getKcSessions()
      .then((s) => setSessions(s))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // no dirty state for this panel
  useEffect(() => { onDirty(false) }, [onDirty])

  useEffect(() => {
    saveRef.current = async () => { /* nothing */ }
    onCancelRef.current = () => { /* nothing */ }
  })

  async function handleRevoke(id: string) {
    setRevoking(id)
    try {
      await revokeKcSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke session')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Active sessions</span>
          {!loading && (
            <span className={styles.cardMeta}>{sessions.length} device{sessions.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className={styles.cardBody}>
          {error && <div className={styles.errorBanner}>{error}</div>}
          {loading && <div className={styles.loadingText}>Loading sessions…</div>}
          {!loading && sessions.length === 0 && (
            <div className={styles.loadingText}>No active sessions found</div>
          )}
          {!loading && sessions.map((sess) => {
            const isCurrent = sess.current ?? false
            const browser = getBrowserName(sess.browser)
            const os = getOsName(sess)
            const lastAccess = sess.lastAccess ? formatRelative(sess.lastAccess) : '—'
            const ip = sess.ipAddress ?? '—'

            return (
              <div key={sess.id} className={styles.sessItem}>
                <div className={styles.sessLeft}>
                  <div className={styles.sessIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.sessName}>
                      {os} · {browser}
                      {isCurrent && (
                        <span className={`${styles.badge} ${styles.badgeCurrent}`} style={{ marginLeft: 6 }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div className={styles.sessMeta}>{ip} · {lastAccess}</div>
                  </div>
                </div>
                {isCurrent
                  ? <span style={{ fontSize: 14, color: '#2a2a2a' }}>—</span>
                  : (
                    <button
                      className={`${styles.btnSm} ${styles.btnRed}`}
                      disabled={revoking === sess.id}
                      onClick={() => void handleRevoke(sess.id)}
                    >
                      {revoking === sess.id ? '…' : 'Revoke'}
                    </button>
                  )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Login history — KC doesn't have a public user-facing history API; show available sessions info */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={`${styles.cardIcon} ${styles.cardIconAmber}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span className={styles.cardTitle}>Login history</span>
          <span className={styles.cardMeta}>Recent activity</span>
        </div>
        <div className={styles.cardBody}>
          {loading && <div className={styles.loadingText}>Loading…</div>}
          {!loading && sessions.length === 0 && (
            <div className={styles.loadingText}>No session data available</div>
          )}
          {!loading && sessions.map((sess) => {
            const browser = getBrowserName(sess.browser)
            const started = sess.started ? formatRelative(sess.started) : '—'
            const ip = sess.ipAddress ?? '—'
            const isCurrent = sess.current ?? false
            return (
              <div key={`h-${sess.id}`} className={styles.sessItem}>
                <div className={styles.sessLeft}>
                  <div
                    className={styles.historyDot}
                    style={{ background: '#1D9E75' }}
                  />
                  <div>
                    <div className={styles.sessName}>Successful login</div>
                    <div className={styles.sessMeta}>{started} · {ip} · {browser}</div>
                  </div>
                </div>
                <span className={`${styles.badge} ${isCurrent ? styles.badgeCurrent : styles.badgeOk}`}>
                  {isCurrent ? 'Current' : 'OK'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
