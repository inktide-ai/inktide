'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/services/auth'
import { ROOT_ROUTE } from '@/lib/routes'
import { keycloak } from '@/lib/keycloak'
import { acceptInvite } from '@/features/organization/api/organization' // fsd:cross-feature-ok
import { ApiError } from '@/api/client'

type PageStatus =
  | 'loading'
  | 'accepting'
  | 'success'
  | 'already_member'
  | 'expired'
  | 'invalid'
  | 'error'

export default function AcceptInvitePage() {
  const { t } = useTranslation('common')
  const params = useParams()
  const router = useRouter()
  const token = typeof params.token === 'string' ? params.token : ''
  const { isLoggedIn, isInitialized } = useAuth()

  const [status, setStatus] = useState<PageStatus>('loading')
  const [orgName, setOrgName] = useState<string | null>(null)

  useEffect(() => {
    if (!isInitialized || !token) return

    if (!isLoggedIn) {
      keycloak.login({
        redirectUri: `${window.location.origin}/invite/${token}`,
      })
      return
    }

    setStatus('accepting')
    acceptInvite(token)
      .then(res => {
        setOrgName(res.organizationName ?? null)
        if (res.result === 'success' || res.result === 'already_member') {
          setStatus(res.result)
          setTimeout(() => router.replace(ROOT_ROUTE), 2000)
        } else if (res.result === 'expired') {
          setStatus('expired')
        } else {
          setStatus('invalid')
        }
      })
      .catch(e => {
        if (e instanceof ApiError && e.status === 401) {
          keycloak.login({ redirectUri: `${window.location.origin}/invite/${token}` })
        } else {
          setStatus('error')
        }
      })
  }, [isInitialized, isLoggedIn, token, router])

  if (status === 'loading' || status === 'accepting') {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-0)]">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 rounded-full border-2 animate-spin border-[var(--border-subtle)] border-t-[var(--accent-primary)]"
          />
          <p className="text-body text-[var(--text-secondary)]">
            {status === 'accepting' ? t('status.acceptingInvite') : t('status.loading')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-0)]">
      <div className="rounded-2xl p-10 text-center max-w-sm w-full mx-4 border border-[var(--border-subtle)] bg-[var(--surface-1)]">
        {status === 'success' && (
          <>
            <div className="text-3xl mb-4">🎉</div>
            <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">
              {t('invite.welcome')}
            </h1>
            <p className="mt-2 text-body text-[var(--text-secondary)]">
              {orgName ? t('invite.joined', { org: orgName }) : t('invite.joinedWorkspace')}
              <br />
              {t('status.redirectingNow')}
            </p>
          </>
        )}

        {status === 'already_member' && (
          <>
            <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">
              {t('invite.alreadyMember')}
            </h1>
            <p className="mt-2 text-body text-[var(--text-secondary)]">
              {orgName ? t('invite.alreadyMemberDesc', { org: orgName }) : t('invite.alreadyMemberDescWorkspace')}
              <br />
              {t('status.redirectingNow')}
            </p>
          </>
        )}

        {status === 'expired' && (
          <>
            <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">
              {t('invite.expired')}
            </h1>
            <p className="mt-2 text-body text-[var(--text-secondary)]">
              {t('invite.expiredDesc')}
            </p>
          </>
        )}

        {(status === 'invalid' || status === 'error') && (
          <>
            <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">
              {t('invite.invalid')}
            </h1>
            <p className="mt-2 text-body text-[var(--text-secondary)]">
              {t('invite.invalidDesc')}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
