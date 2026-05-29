'use client'
import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { requestEmailChange, verifyEmailChange } from '@/features/account/api/email-change'

interface Props {
  open: boolean
  onClose: () => void
  currentEmail: string
  onSaved: (newEmail: string) => void
}

type Step = 'email' | 'code'

export default function ChangeEmailModal({ open, onClose, currentEmail, onSaved }: Props) {
  const [step, setStep] = useState<Step>('email')
  const [emailDraft, setEmailDraft] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  // Reset on open
  useEffect(() => {
    if (!open) return
    setStep('email')
    setEmailDraft('')
    setCode('')
    setError(null)
  }, [open])

  // Focus correct input after step change
  useEffect(() => {
    const el = step === 'email' ? emailRef.current : codeRef.current
    if (open && el) setTimeout(() => el.focus(), 60)
  }, [step, open])

  async function handleSendCode() {
    const email = emailDraft.trim().toLowerCase()
    if (!email) { setError('Email is required.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return }
    if (email === currentEmail.trim().toLowerCase()) { setError('This is already your current email.'); return }
    setBusy(true)
    setError(null)
    try {
      await requestEmailChange(email)
      setPendingEmail(email)
      setStep('code')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send code. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleVerify() {
    if (!code.trim()) { setError('Enter the verification code.'); return }
    setBusy(true)
    setError(null)
    try {
      const { newEmail } = await verifyEmailChange(code.trim())
      onSaved(newEmail)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[2100] bg-black/45" />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[2100] w-[400px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] p-6 outline-none bg-[var(--menu-panel-bg)] shadow-[var(--menu-panel-shadow)]"
          onInteractOutside={() => onClose()}
        >
          <DialogTitle className="sr-only">
            {step === 'email' ? 'Change email address' : 'Verify email address'}
          </DialogTitle>

          {/* Icon + title */}
          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
              {step === 'email' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-10 7L2 7"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l7 4v5c0 4.418-3.134 8.573-7 10-3.866-1.427-7-5.582-7-10V6l7-4z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              )}
            </div>
            <div className="text-[15px] font-semibold text-[var(--text-heading)]">
              {step === 'email' ? 'Change email address' : 'Verify email address'}
            </div>
            <div className="text-body text-[var(--text-tertiary)]">
              {step === 'email'
                ? "We'll send a verification code to your new email."
                : <><span className="text-[var(--text-primary)]">{pendingEmail}</span> — check your inbox and enter the code below.</>}
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-body text-[var(--danger-text)]">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <>
              <div className="mb-5">
                <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">Email address</label>
                <input
                  ref={emailRef}
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleSendCode()}
                  placeholder="example@company.com"
                  className="w-full rounded-[8px] border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-[11px] py-[9px] text-body text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent-primary)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} disabled={busy} className="rounded-[7px] border border-[var(--border-default)] bg-transparent px-4 py-[7px] text-body text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40">
                  Cancel
                </button>
                <button type="button" onClick={() => void handleSendCode()} disabled={busy} className="rounded-[7px] bg-[var(--accent-primary)] px-4 py-[7px] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                  {busy ? 'Sending…' : 'Send code →'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-5">
                <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">Verification code</label>
                <input
                  ref={codeRef}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void handleVerify()}
                  placeholder="e.g. sDqu7U"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="w-full rounded-[8px] border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-[11px] py-[9px] font-mono text-body tracking-[0.15em] text-[var(--text-primary)] outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--text-disabled)] focus:border-[var(--accent-primary)]"
                />
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" onClick={() => { setStep('email'); setCode(''); setError(null) }} disabled={busy} className="rounded-[7px] border border-[var(--border-default)] bg-transparent px-4 py-[7px] text-body text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40">
                  ← Back
                </button>
                <button type="button" onClick={() => void handleVerify()} disabled={busy} className="rounded-[7px] bg-[var(--accent-primary)] px-4 py-[7px] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                  {busy ? 'Verifying…' : 'Verify email'}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
