'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Shield, X } from 'lucide-react'
import { getAppInfo, type AppInfoDto } from '@/features/developer/api/developer'
import { useAuth } from '@/shared/services/auth/AuthContext'
import { apiFetch } from '@/api/client'

const STORAGE_KEY = 'oauth_pending'

/** Hostname for display, or a safe fallback if the URI is malformed. */
function safeHostname(uri: string): string {
  try { return new URL(uri).hostname } catch { return uri }
}

/** Only http(s) targets may be used for navigation - blocks javascript:/data: schemes. */
function isSafeHttpUrl(uri: string): boolean {
  try {
    const u = new URL(uri)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

function OAuthAuthorizeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isInitialized } = useAuth()
  const authLoading = !isInitialized

  const clientId   = searchParams.get('client_id') ?? ''
  const redirectUri = searchParams.get('redirect_uri') ?? ''
  const scope      = searchParams.get('scope')
  const state      = searchParams.get('state') ?? ''

  const [appInfo, setAppInfo]   = useState<AppInfoDto | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const [approving, setApproving] = useState(false)
  const [soulId] = useState<string>('')

  useEffect(() => {
    if (!clientId || !redirectUri) {
      setError('Missing client_id or redirect_uri')
      setLoading(false)
      return
    }

    getAppInfo(clientId, scope, redirectUri)
      .then(setAppInfo)
      .catch(() => setError('Unknown application or invalid redirect_uri'))
      .finally(() => setLoading(false))
  }, [clientId, redirectUri, scope])

  // Handle unauthenticated users - save params and redirect to login
  useEffect(() => {
    if (authLoading || loading) return
    if (!user && appInfo) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
        client_id: clientId, redirect_uri: redirectUri, scope, state,
      }))
      router.replace(`/login?returnUrl=${encodeURIComponent('/oauth/authorize')}`)
    }
  }, [authLoading, loading, user, appInfo, clientId, redirectUri, scope, state, router])

  // Restore params from sessionStorage after login redirect
  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved && user) {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  async function handleApprove() {
    if (!user || !appInfo) return
    setApproving(true)
    try {
      const res = await apiFetch('/api/oauth/consent/approve', {
        method: 'POST',
        body: JSON.stringify({ clientId, redirectUri, scopes: scope?.split(' ') ?? [], state, soulId: soulId || null }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.redirectUrl && isSafeHttpUrl(data.redirectUrl)) {
          window.location.href = data.redirectUrl
        } else {
          setError('Authorization failed: invalid redirect target.')
        }
      } else {
        setError('Authorization failed. Please try again.')
      }
    } catch {
      setError('Authorization failed. Please try again.')
    } finally {
      setApproving(false)
    }
  }

  function handleCancel() {
    if (!isSafeHttpUrl(redirectUri)) {
      setError('Invalid redirect_uri.')
      return
    }
    const cancelUrl = `${redirectUri}?error=access_denied&state=${encodeURIComponent(state)}`
    window.location.href = cancelUrl
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-0)]">
        <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-0)]">
        <div className="max-w-sm w-full mx-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
          <X size={24} className="text-red-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  if (!appInfo) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-0)] px-4">
      <div className="max-w-sm w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 flex flex-col gap-5 shadow-lg">

        {/* App header */}
        <div className="flex flex-col items-center gap-3 text-center">
          {appInfo.iconUrl ? (
            <img src={appInfo.iconUrl} alt={appInfo.appName} className="w-14 h-14 rounded-xl" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-xl font-bold text-[var(--text-tertiary)]">
              {appInfo.appName.charAt(0)}
            </div>
          )}
          <div>
            <p className="text-base font-semibold text-[var(--text-heading)]">
              {appInfo.appName}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              by {appInfo.developerName} wants access to your Inktide account
            </p>
          </div>
        </div>

        {/* Scopes */}
        {appInfo.requestedScopes.length > 0 && (
          <div className="rounded-xl bg-[var(--surface-1)] p-4 flex flex-col gap-2">
            <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">Permissions</p>
            {appInfo.requestedScopes.map(s => (
              <div key={s.scope} className="flex items-start gap-2">
                <Shield size={13} className="text-blue-400 shrink-0 mt-0.5" />
                <span className="text-sm text-[var(--text-primary)]">{s.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Redirect info */}
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          After authorization you will be redirected to{' '}
          <span className="font-medium text-[var(--text-secondary)]">
            {safeHostname(redirectUri)}
          </span>
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="h-10 rounded-lg bg-[var(--text-primary)] text-sm font-medium text-[var(--bg-0)] hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {approving ? 'Authorizing…' : `Authorize ${appInfo.appName}`}
          </button>
          <button
            onClick={handleCancel}
            className="h-10 rounded-lg border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OAuthAuthorizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-sm text-[var(--text-secondary)]">Loading…</p></div>}>
      <OAuthAuthorizeContent />
    </Suspense>
  )
}
