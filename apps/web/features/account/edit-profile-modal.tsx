'use client'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
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
  const { t } = useTranslation('account')
  const [step, setStep] = useState<Step>('email')
  const [pendingEmail, setPendingEmail] = useState('')

  const emailSchema = useMemo(() => z.object({
    email: z.string()
      .min(1, t('emailChange.errors.emailRequired'))
      .email(t('emailChange.errors.emailInvalid'))
      .refine((v) => v.trim().toLowerCase() !== currentEmail.trim().toLowerCase(), t('emailChange.errors.sameEmail')),
  }), [currentEmail, t])

  const codeSchema = z.object({ code: z.string().min(1, t('emailChange.errors.codeRequired')) })

  const emailForm = useForm<{ email: string }>({
    resolver: standardSchemaResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const codeForm = useForm<{ code: string }>({
    resolver: standardSchemaResolver(codeSchema),
    defaultValues: { code: '' },
  })

  useEffect(() => {
    if (!open) return
    setStep('email')
    setPendingEmail('')
    emailForm.reset()
    codeForm.reset()
    setTimeout(() => emailForm.setFocus('email'), 60)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const onEmailSubmit = async (data: { email: string }) => {
    try {
      await requestEmailChange(data.email)
      setPendingEmail(data.email)
      setStep('code')
      setTimeout(() => codeForm.setFocus('code'), 60)
    } catch (e) {
      emailForm.setError('root', { message: e instanceof Error ? e.message : t('emailChange.errors.sendFailed') })
    }
  }

  const onCodeSubmit = async (data: { code: string }) => {
    try {
      const { newEmail } = await verifyEmailChange(data.code.trim())
      onSaved(newEmail)
      onClose()
    } catch (e) {
      codeForm.setError('root', { message: e instanceof Error ? e.message : t('emailChange.errors.verifyFailed') })
    }
  }

  const goBack = () => {
    setStep('email')
    codeForm.reset()
    setTimeout(() => emailForm.setFocus('email'), 60)
  }

  const inputCls = 'w-full rounded-[8px] border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-[11px] py-[9px] text-body text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent-primary)]'

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[2100] bg-black/45" />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[2100] w-[400px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] p-6 outline-none bg-[var(--menu-panel-bg)] shadow-[var(--menu-panel-shadow)]"
          onInteractOutside={() => onClose()}
        >
          <DialogTitle className="sr-only">
            {step === 'email' ? t('emailChange.changeTitle') : t('emailChange.verifyTitle')}
          </DialogTitle>

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
              {step === 'email' ? t('emailChange.changeTitle') : t('emailChange.verifyTitle')}
            </div>
            <div className="text-body text-[var(--text-tertiary)]">
              {step === 'email'
                ? t('emailChange.sendDesc')
                : <><span className="text-[var(--text-primary)]">{pendingEmail}</span> {t('emailChange.checkInbox')}</>}
            </div>
          </div>

          {step === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              {emailForm.formState.errors.root && (
                <div className="mb-3 rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-body text-[var(--danger-text)]">
                  {emailForm.formState.errors.root.message}
                </div>
              )}
              <div className="mb-5">
                <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">{t('emailChange.emailLabel')}</label>
                <input
                  {...emailForm.register('email')}
                  type="email"
                  placeholder={t('emailChange.emailPlaceholder')}
                  className={inputCls}
                />
                {emailForm.formState.errors.email && (
                  <p className="mt-1 text-2xs text-[var(--danger-text)]">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} disabled={emailForm.formState.isSubmitting} className="rounded-[7px] border border-[var(--border-default)] bg-transparent px-4 py-[7px] text-body text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40">
                  {t('emailChange.cancel')}
                </button>
                <button type="submit" disabled={emailForm.formState.isSubmitting} className="rounded-[7px] bg-[var(--accent-primary)] px-4 py-[7px] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                  {emailForm.formState.isSubmitting ? t('emailChange.sending') : t('emailChange.sendCode')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={codeForm.handleSubmit(onCodeSubmit)}>
              {codeForm.formState.errors.root && (
                <div className="mb-3 rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-body text-[var(--danger-text)]">
                  {codeForm.formState.errors.root.message}
                </div>
              )}
              <div className="mb-5">
                <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">{t('emailChange.codeLabel')}</label>
                <input
                  {...codeForm.register('code')}
                  type="text"
                  placeholder={t('emailChange.codePlaceholder')}
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="w-full rounded-[8px] border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-[11px] py-[9px] font-mono text-body tracking-[0.15em] text-[var(--text-primary)] outline-none transition-colors placeholder:font-sans placeholder:tracking-normal placeholder:text-[var(--text-disabled)] focus:border-[var(--accent-primary)]"
                />
                {codeForm.formState.errors.code && (
                  <p className="mt-1 text-2xs text-[var(--danger-text)]">{codeForm.formState.errors.code.message}</p>
                )}
              </div>
              <div className="flex justify-between gap-2">
                <button type="button" onClick={goBack} disabled={codeForm.formState.isSubmitting} className="rounded-[7px] border border-[var(--border-default)] bg-transparent px-4 py-[7px] text-body text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] disabled:opacity-40">
                  {t('emailChange.back')}
                </button>
                <button type="submit" disabled={codeForm.formState.isSubmitting} className="rounded-[7px] bg-[var(--accent-primary)] px-4 py-[7px] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40">
                  {codeForm.formState.isSubmitting ? t('emailChange.verifying') : t('emailChange.verify')}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
