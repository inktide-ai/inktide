'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { keycloak } from '@/lib/keycloak'
import {
  getKcCredentials,
  revokeAllKcSessions,
  type KcCredential,
} from '@/api/keycloak-account'
import { deleteAccount } from '@/api/me'
import DeleteAccountModal from '@/features/character-editor/delete-account-modal'
import { cn } from '@/lib/utils'
import { useAccountNav } from '../user-account-settings'

export default function SecurityPanel() {
  const { logout, userEmail } = useAuth()
  const router = useRouter()
  const { setActivePage } = useAccountNav()

  const [credentials, setCredentials] = useState<KcCredential[]>([])
  const [credsLoading, setCredsLoading] = useState(true)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getKcCredentials()
      .then((c) => { if (!cancelled) setCredentials(c) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setCredsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const hasTOTP = credentials.some((c) => c.type === 'otp' || c.type === 'totp')

  const handleRevokeAll = useCallback(async () => {
    await revokeAllKcSessions()
    logout()
    router.push('/')
  }, [logout, router])

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteAccount()
      setDeleteOpen(false)
      logout()
      router.push('/')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Could not delete account')
    } finally {
      setIsDeleting(false)
    }
  }, [logout, router])

  function handleSetupTOTP() {
    keycloak.login({ action: 'CONFIGURE_TOTP' })
  }

  return (
    <>
      {/* ── Two-Step Verification ─────────────────────────────────────────── */}
      <div className="mt-[36px]" />
      <SectionHeader>Two-step verification</SectionHeader>

      <div>
        <SecurityRow
          label="Two-step verification"
          value="Add an extra layer of security to your account"
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Authenticator app"
          value={
            <span className="flex items-center gap-2">
              <span>Use an authenticator app to generate codes.</span>
              {!credsLoading && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-[1px] text-[10px] font-medium',
                    hasTOTP
                      ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      : 'bg-[var(--accent-violet-bg)] text-[var(--accent-violet-text)]',
                  )}
                >
                  {hasTOTP ? 'Enabled' : 'Recommended'}
                </span>
              )}
            </span>
          }
          action={
            credsLoading ? (
              <span className="text-[14px] text-[var(--text-disabled)]">…</span>
            ) : hasTOTP ? (
              <span className="text-[14px] text-[var(--text-disabled)]">Configured</span>
            ) : (
              <button
                type="button"
                onClick={handleSetupTOTP}
                className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                Set up
              </button>
            )
          }
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Backup codes"
          value="Use backup codes to access your account."
          action={
            <span className="text-[14px] text-[var(--text-disabled)]">Coming soon</span>
          }
        />
      </div>

      {/* ── Active Devices ────────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Active devices</SectionHeader>

      <div>
        <SecurityRow
          label="Active devices"
          value="Manage devices that have access to your account."
          action={
            <button
              type="button"
              onClick={() => setActivePage('sessions')}
              className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-[14px] font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
            >
              View sessions
            </button>
          }
        />
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader className="text-[var(--danger-text)]">Danger zone</SectionHeader>

      <div>
        <SecurityRow
          label="Sign out everywhere"
          value="Log out from all devices immediately"
          action={
            <button
              type="button"
              onClick={() => void handleRevokeAll()}
              className="shrink-0 rounded-[7px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-[5px] text-[14px] font-medium text-[var(--danger-text)] transition-opacity hover:opacity-80"
            >
              Sign out all
            </button>
          }
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Delete account"
          value="Permanently remove your account and all data"
          action={
            <button
              type="button"
              onClick={() => { setDeleteError(null); setDeleteOpen(true) }}
              className="shrink-0 rounded-[7px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-[5px] text-[14px] font-medium text-[var(--danger-text)] transition-opacity hover:opacity-80"
            >
              Delete
            </button>
          }
        />
      </div>

      {deleteOpen && (
        <DeleteAccountModal
          userEmail={userEmail}
          isDeleting={isDeleting}
          error={deleteError}
          onClose={() => { setDeleteOpen(false); setDeleteError(null) }}
          onConfirm={() => void handleDeleteConfirm()}
        />
      )}
    </>
  )
}

function SectionHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-[16px] mt-0 border-b border-[var(--settings-card-border)] pb-[12px] text-[16px] font-medium text-[var(--text-heading)] ${className}`}>
      {children}
    </div>
  )
}

function SecurityRow({
  label,
  value,
  action,
}: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-[11px]">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">{label}</div>
        <div className="text-[14px] font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">
          {typeof value === 'string' ? <span className="break-words">{value}</span> : value}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
