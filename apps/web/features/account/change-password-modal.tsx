'use client'
import { useEffect, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { changeKcPassword } from '@/api/keycloak-account'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  hasExistingPassword: boolean
  onSaved: () => void
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
const STRENGTH_CLASSES = ['', 'bg-[#E24B4A]', 'bg-[#EF9F27]', 'bg-[#1D9E75]', 'bg-[#1D9E75]']

export default function ChangePasswordModal({ open, onClose, hasExistingPassword, onSaved }: Props) {
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setError(null)
  }, [open])

  useEffect(() => {
    if (open && firstRef.current) setTimeout(() => firstRef.current?.focus(), 60)
  }, [open])

  async function handleSubmit() {
    setError(null)
    if (hasExistingPassword && !currentPw) { setError('Enter your current password.'); return }
    if (!newPw) { setError('Enter a new password.'); return }
    if (newPw.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      await changeKcPassword(currentPw, newPw)
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change password.')
    } finally {
      setBusy(false)
    }
  }

  const score = scorePassword(newPw)
  const title = hasExistingPassword ? 'Change password' : 'Set a password'
  const inputCls =
    'w-full rounded-[8px] border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-[11px] py-[9px] text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent-primary)]'

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[2100]" style={{ background: 'rgba(0,0,0,0.45)' }} />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[2100] w-[400px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] p-6 outline-none"
          style={{ background: 'var(--menu-panel-bg)', boxShadow: 'var(--menu-panel-shadow)' }}
          onInteractOutside={() => onClose()}
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>

          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="text-[15px] font-semibold text-[var(--text-heading)]">{title}</div>
            <div className="text-[14px] text-[var(--text-tertiary)]">
              Use a password at least 15 letters long, or at least 8 characters long with both letters and numbers.
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-[14px] text-[var(--danger-text)]">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {hasExistingPassword && (
              <div>
                <label className="mb-[5px] block text-[14px] text-[var(--text-tertiary)]">Current password</label>
                <input
                  ref={firstRef}
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Current password"
                  autoComplete="current-password"
                  className={inputCls}
                />
              </div>
            )}
            <div>
              <label className="mb-[5px] block text-[14px] text-[var(--text-tertiary)]">
                {hasExistingPassword ? 'Enter a new password' : 'New password'}
              </label>
              <input
                ref={hasExistingPassword ? undefined : firstRef}
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-[5px] block text-[14px] text-[var(--text-tertiary)]">Confirm your new password</label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
                placeholder="Confirm password"
                autoComplete="new-password"
                className={inputCls}
              />
            </div>

            {newPw && (
              <div>
                <div className="flex gap-[6px]">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-[3px] flex-1 rounded-[2px] bg-[var(--settings-input-border)] transition-colors duration-200',
                        i <= score ? STRENGTH_CLASSES[score] : '',
                      )}
                    />
                  ))}
                </div>
                <div className="mt-1 text-[10px] text-[var(--text-disabled)]">
                  Password strength: {STRENGTH_LABELS[score] || '—'}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={busy}
              className="mt-1 w-full rounded-[7px] bg-[var(--accent-primary)] py-[9px] text-[14px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {busy ? 'Saving…' : title}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
