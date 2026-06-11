'use client'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/services/auth'
import { ROOT_ROUTE } from '@/lib/routes'
import { signIn } from 'next-auth/react'
import {
  getKcCredentials,
  revokeAllKcSessions,
  type KcCredential,
} from '@/features/account/api/keycloak-account'
import { deleteAccount } from '@/api/me'
import DeleteAccountModal from '@/features/account/delete-account-modal'
import { cn } from '@/lib/utils'
import { useAccountNav } from '../user-account-settings'

export default function SecurityPanel() {
  const { t } = useTranslation('account')
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
    router.push(ROOT_ROUTE)
  }, [logout, router])

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteAccount()
      setDeleteOpen(false)
      logout()
      router.push(ROOT_ROUTE)
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t('security.delete'))
    } finally {
      setIsDeleting(false)
    }
  }, [logout, router])

  function handleSetupTOTP() {
    void signIn('keycloak', { callbackUrl: window.location.pathname }, { kc_action: 'CONFIGURE_TOTP' })
  }

  return (
    <>
      <div className="mt-[36px]" />
      <SectionHeader>{t('security.twoStep')}</SectionHeader>

      <div>
        <SecurityRow
          label={t('security.twoStep')}
          value={t('security.twoStepDesc')}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('security.authenticatorApp')}
          value={
            <span className="flex items-center gap-2">
              <span>{t('security.authenticatorDesc')}</span>
              {!credsLoading && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-[1px] text-2xs font-medium',
                    hasTOTP
                      ? 'bg-[var(--success-bg)] text-[var(--success-text)]'
                      : 'bg-[var(--accent-violet-bg)] text-[var(--accent-violet-text)]',
                  )}
                >
                  {hasTOTP ? t('security.enabled') : t('security.recommended')}
                </span>
              )}
            </span>
          }
          action={
            credsLoading ? (
              <span className="text-body text-[var(--text-disabled)]">…</span>
            ) : hasTOTP ? (
              <span className="text-body text-[var(--text-disabled)]">{t('security.configured')}</span>
            ) : (
              <button
                type="button"
                onClick={handleSetupTOTP}
                className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                {t('security.setUp')}
              </button>
            )
          }
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('security.backupCodes')}
          value={t('security.backupCodesDesc')}
          action={
            <span className="text-body text-[var(--text-disabled)]">{t('security.comingSoon')}</span>
          }
        />
      </div>

      <div className="mt-[48px]" />
      <SectionHeader>{t('security.activeDevices')}</SectionHeader>

      <div>
        <SecurityRow
          label={t('security.activeDevicesTitle')}
          value={t('security.activeDevicesDesc')}
          action={
            <button
              type="button"
              onClick={() => setActivePage('sessions')}
              className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
            >
              {t('security.viewSessions')}
            </button>
          }
        />
      </div>

      <div className="mt-[48px]" />
      <SectionHeader className="text-[var(--danger-text)]">{t('security.dangerZone')}</SectionHeader>

      <div>
        <SecurityRow
          label={t('security.signOutEverywhere')}
          value={t('security.signOutDesc')}
          action={
            <button
              type="button"
              onClick={() => void handleRevokeAll()}
              className="shrink-0 rounded-[7px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-[5px] text-body font-medium text-[var(--danger-text)] transition-opacity hover:opacity-80"
            >
              {t('security.signOutAll')}
            </button>
          }
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('security.deleteAccount')}
          value={t('security.deleteAccountDesc')}
          action={
            <button
              type="button"
              onClick={() => { setDeleteError(null); setDeleteOpen(true) }}
              className="shrink-0 rounded-[7px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-[5px] text-body font-medium text-[var(--danger-text)] transition-opacity hover:opacity-80"
            >
              {t('security.delete')}
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="text-body font-medium leading-[20px] text-[var(--text-primary)]">{label}</div>
        <div className="text-body font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">
          {typeof value === 'string' ? <span className="break-words">{value}</span> : value}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
