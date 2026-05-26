'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  getKcSessions,
  revokeAllKcSessions,
  revokeKcSession,
  type KcSession,
} from '@/api/keycloak-account'

function formatRelative(ts?: number): string {
  if (!ts) return '—'
  const diff = Date.now() - ts * 1000
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Active now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function getBrowserName(ua?: string): string {
  if (!ua) return 'Unknown browser'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return ua
}

function getOsLabel(sess: KcSession): string {
  const os = sess.os ?? ''
  const v = sess.osVersion ? ` ${sess.osVersion}` : ''
  return os ? `${os}${v}` : 'Unknown OS'
}

function isMobile(sess: KcSession): boolean {
  const os = sess.os?.toLowerCase() ?? ''
  return os.includes('ios') || os.includes('android')
}

function DeviceIcon({ mobile }: { mobile: boolean }) {
  if (mobile) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
  )
}

export default function SessionsPanel() {
  const { logout } = useAuth()
  const router = useRouter()

  const [sessions, setSessions] = useState<KcSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    getKcSessions()
      .then((s) => setSessions(s))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const current = useMemo(() => sessions.find((s) => s.current), [sessions])
  const others = useMemo(() => sessions.filter((s) => !s.current), [sessions])

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

  async function handleRevokeAll() {
    setRevokingAll(true)
    try {
      await revokeAllKcSessions()
      logout()
      router.push('/')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign out other sessions')
      setRevokingAll(false)
    }
  }

  return (
    <>
      {error && (
        <div className="mt-[16px] rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-[14px] text-[var(--danger-text)]">
          {error}
        </div>
      )}

      {/* ── Current session ───────────────────────────────────────────────── */}
      <div className="mt-[36px]" />
      <SectionHeader>Current session</SectionHeader>

      {loading && !current && (
        <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">Loading…</div>
      )}
      {current && (
        <div className="flex items-center gap-3 py-[11px]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-violet-bg)] text-[var(--accent-violet-text)] [&>svg]:h-[18px] [&>svg]:w-[18px]">
            <DeviceIcon mobile={isMobile(current)} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">This device</span>
              <span className="inline-flex items-center rounded-full bg-[var(--success-bg)] px-2 py-[1px] text-[10px] font-medium text-[var(--success-text)]">You</span>
            </div>
            <div className="text-[14px] font-normal leading-[18px] text-[var(--text-secondary)]">
              {getBrowserName(current.browser)} · {getOsLabel(current)} · {current.ipAddress ?? '—'}
            </div>
          </div>
          <span className="shrink-0 text-[14px] font-medium text-[var(--success-text)]">{formatRelative(current.lastAccess)}</span>
        </div>
      )}

      {/* ── Other sessions ────────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>
        <span className="flex items-center justify-between">
          <span>Other sessions</span>
          <span className="text-[14px] font-normal text-[var(--text-disabled)]">{others.length} device{others.length === 1 ? '' : 's'}</span>
        </span>
      </SectionHeader>

      {loading && (
        <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">Loading…</div>
      )}
      {!loading && others.length === 0 && (
        <div className="py-6 text-center text-[14px] text-[var(--text-disabled)]">No other active sessions</div>
      )}
      {!loading && others.map((sess, idx) => (
        <div key={sess.id}>
          {idx > 0 && <div className="h-[24px]" />}
          <div className="flex items-center gap-3 py-[11px]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] [&>svg]:h-[18px] [&>svg]:w-[18px]">
              <DeviceIcon mobile={isMobile(sess)} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">
                {getOsLabel(sess)} · {getBrowserName(sess.browser)}
              </div>
              <div className="text-[14px] font-normal leading-[18px] text-[var(--text-secondary)]">
                {sess.ipAddress ?? '—'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[14px] text-[var(--text-disabled)]">{formatRelative(sess.lastAccess)}</span>
              <button
                type="button"
                onClick={() => void handleRevoke(sess.id)}
                disabled={revoking === sess.id}
                className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-40"
              >
                {revoking === sess.id ? '…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {others.length > 0 && (
        <>
          <div className="mt-[24px]" />
          <button
            type="button"
            onClick={() => void handleRevokeAll()}
            disabled={revokingAll}
            className="w-full rounded-[7px] border border-[var(--danger-border)] bg-[var(--danger-bg)] py-[8px] text-[14px] font-medium text-[var(--danger-text)] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {revokingAll ? 'Signing out…' : 'Sign out all other sessions'}
          </button>
        </>
      )}
    </>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[16px] mt-0 border-b border-[var(--settings-card-border)] pb-[12px] text-[16px] font-medium text-[var(--text-heading)]">
      {children}
    </div>
  )
}
