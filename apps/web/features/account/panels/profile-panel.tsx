'use client'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '@/shared/services/auth'
import { getKcProfile, updateKcProfile, getKcCredentials, type KcAccountProfile, type KcCredential } from '@/features/account/api/keycloak-account'
import { getStorageStatus, patchAvatar, uploadProfileFile } from '@/api/me'
import ChangeEmailModal from '../edit-profile-modal'
import ChangePasswordModal from '../change-password-modal'

export default function ProfilePanel() {
  const { t } = useTranslation('account')
  const { user, userEmail, refreshSession, setNickname, setPictureUrl } = useAuth()

  const [profile, setProfile] = useState<KcAccountProfile | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [storageEnabled, setStorageEnabled] = useState<boolean | null>(null)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [credentials, setCredentials] = useState<KcCredential[]>([])
  const [pwOpen, setPwOpen] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  // Seed display name from auth context immediately
  useEffect(() => {
    setNameDraft((user?.nickname ?? user?.userName ?? '').trim())
  }, [user?.nickname, user?.userName])

  // Fetch full profile in background for save integrity
  useEffect(() => {
    let cancelled = false
    getKcProfile()
      .then((p) => { if (!cancelled) setProfile(p) })
      .catch(() => {/* silently ignore */})
    return () => { cancelled = true }
  }, [])

  // Check storage availability
  useEffect(() => {
    let cancelled = false
    getStorageStatus()
      .then((s) => { if (!cancelled) setStorageEnabled(s.enabled) })
      .catch(() => { if (!cancelled) setStorageEnabled(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    getKcCredentials()
      .then((c) => { if (!cancelled) setCredentials(c) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const hasPassword = credentials.some((c) => c.type === 'password')

  const onAvatarPick = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError(t('profile.errorNotImage'))
      return
    }
    setAvatarError(null)
    setAvatarBusy(true)
    try {
      const { key } = await uploadProfileFile(file)
      const { pictureUrl } = await patchAvatar(key)
      setPictureUrl(pictureUrl)
      await refreshSession()
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : t('profile.errorUploadFailed'))
    } finally {
      setAvatarBusy(false)
    }
  }, [refreshSession])

  async function saveName() {
    const name = nameDraft.trim()
    if (name === (user?.nickname ?? user?.userName ?? '').trim()) return
    setNameSaving(true)
    try {
      if (profile) await updateKcProfile({ ...profile, firstName: name, lastName: '' })
      setNickname(name.slice(0, 64))
    } catch {
      /* silently ignore - local nickname still updates */
      setNickname(name.slice(0, 64))
    } finally {
      setNameSaving(false)
    }
  }

  async function copyUserId() {
    if (!user?.userId) return
    try {
      await navigator.clipboard.writeText(user.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {/* ignore */}
  }

  const initialLetter = (user?.userName ?? 'U').replace(/^\./, '').charAt(0).toUpperCase()
  const email = profile?.email ?? userEmail ?? '—'

  return (
    <>
      <div className="mt-[36px]" />
      <SectionHeader>{t('nav.account')}</SectionHeader>

      <div className="flex flex-col">
        <div className="flex items-center">
          <button
            type="button"
            disabled={avatarBusy || storageEnabled === false}
            onClick={() => fileRef.current?.click()}
            className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-80 disabled:cursor-default disabled:opacity-60"
            title={storageEnabled === false ? t('profile.storageNotConfigured') : t('profile.changeAvatar')}
          >
            {user?.pictureUrl
              ? <img src={user.pictureUrl} alt="" className="h-full w-full rounded-full object-cover" />
              : <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#8456FF] to-[#EC4899] text-[24px] font-semibold text-white">{initialLetter}</span>}
            {avatarBusy && (
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-body text-white">…</span>
            )}
          </button>
          <div className="ml-[20px] w-[250px]">
            <label className="mb-[4px] block text-body leading-[16px] text-[var(--text-secondary)]">{t('profile.preferredName')}</label>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value.slice(0, 64))}
              onBlur={() => void saveName()}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder={t('profile.yourName')}
              className={[
                'w-full rounded-[8px] border px-[10px] py-[7px] text-body text-[var(--text-heading)] outline-none transition-colors',
                'bg-[var(--settings-input-bg)] placeholder:text-[var(--text-disabled)]',
                'border-[var(--settings-input-border)] focus:border-[var(--accent-primary)]',
                nameSaving ? 'opacity-60' : '',
              ].join(' ')}
            />
          </div>
        </div>
        {storageEnabled !== false && (
          <div className="mt-[8px] text-body">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={avatarBusy}
              className="text-[var(--accent-violet-text)] transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              {t('profile.change')}
            </button>{' '}
            <span className="text-[var(--text-secondary)]">{t('profile.yourAvatar')}</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
        {avatarError && (
          <p className="mt-2 text-2xs text-[var(--danger-text)]">{avatarError}</p>
        )}
      </div>

      <div className="mt-[48px]" />
      <SectionHeader>{t('profile.accountSecurity')}</SectionHeader>

      <div>
        {/* Email */}
        <SecurityRow
          label={t('profile.email')}
          value={email}
          action={
            <button
              type="button"
              onClick={() => setChangeEmailOpen(true)}
              className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
            >
              {t('profile.changeEmail')}
            </button>
          }
        />

        <div className="h-[24px]" />
        <SecurityRow
          label={t('profile.password')}
          value={hasPassword ? t('profile.hasPassword') : t('profile.noPassword')}
          action={
            <button
              type="button"
              onClick={() => setPwOpen(true)}
              className="shrink-0 rounded-[7px] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-[5px] text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
            >
              {hasPassword ? t('profile.changePassword') : t('profile.addPassword')}
            </button>
          }
        />

        <div className="h-[24px]" />
        {/* Member since */}
        <SecurityRow label={t('profile.memberSince')} value="May 18, 2026" />
      </div>

      <div className="mt-[48px]" />
      <SectionHeader>{t('profile.userId')}</SectionHeader>

      <div className="divide-y divide-[var(--settings-card-border)]">
        <SecurityRow
          label={t('profile.userId')}
          value={
            <span className="font-mono text-body font-normal text-pretty text-[var(--text-secondary)]">
              {user?.userId ?? '—'}
            </span>
          }
          action={
            user?.userId ? (
              <button
                type="button"
                onClick={() => void copyUserId()}
                aria-label={t('profile.copyUserId')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
              >
                {copied
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
              </button>
            ) : null
          }
        />
      </div>

      <ChangeEmailModal
        open={changeEmailOpen}
        onClose={() => setChangeEmailOpen(false)}
        currentEmail={email === '—' ? '' : email}
        onSaved={(newEmail) => {
          setProfile((prev) => prev ? { ...prev, email: newEmail } : prev)
        }}
      />

      <ChangePasswordModal
        open={pwOpen}
        onClose={() => setPwOpen(false)}
        hasExistingPassword={hasPassword}
        onSaved={() => {}}
      />
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
