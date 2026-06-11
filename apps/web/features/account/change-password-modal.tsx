'use client'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { changeKcPassword } from '@/features/account/api/keycloak-account'
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

const STRENGTH_CLASSES = ['', 'bg-[#E24B4A]', 'bg-[#EF9F27]', 'bg-[#1D9E75]', 'bg-[#1D9E75]']

type FormValues = { currentPw: string; newPw: string; confirmPw: string }

export default function ChangePasswordModal({ open, onClose, hasExistingPassword, onSaved }: Props) {
  const { t } = useTranslation('account')

  const schema = useMemo(() => z.object({
    currentPw: z.string(),
    newPw: z.string().min(8, t('changePassword.errors.tooShort')),
    confirmPw: z.string(),
  }).superRefine((data, ctx) => {
    if (hasExistingPassword && !data.currentPw) {
      ctx.addIssue({ code: 'custom', message: t('changePassword.errors.enterCurrent'), path: ['currentPw'] })
    }
    if (data.newPw !== data.confirmPw) {
      ctx.addIssue({ code: 'custom', message: t('changePassword.errors.mismatch'), path: ['confirmPw'] })
    }
  }), [t, hasExistingPassword])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { currentPw: '', newPw: '', confirmPw: '' },
  })

  useEffect(() => {
    if (!open) return
    reset()
    setTimeout(() => setFocus(hasExistingPassword ? 'currentPw' : 'newPw'), 60)
  }, [open, reset, setFocus, hasExistingPassword])

  const newPw = watch('newPw')
  const score = scorePassword(newPw)
  const STRENGTH_LABELS = ['', t('changePassword.strength.weak'), t('changePassword.strength.fair'), t('changePassword.strength.good'), t('changePassword.strength.strong')]
  const title = hasExistingPassword ? t('changePassword.title') : t('changePassword.setTitle')

  const onSubmit = async (data: FormValues) => {
    try {
      await changeKcPassword(data.currentPw, data.newPw)
      onSaved()
      onClose()
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : t('changePassword.errors.failed') })
    }
  }

  const inputCls =
    'w-full rounded-[8px] border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-[11px] py-[9px] text-body text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-disabled)] focus:border-[var(--accent-primary)]'
  const fieldErrorCls = 'mt-1 text-2xs text-[var(--danger-text)]'

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose() }}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[2100] bg-black/45" />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[2100] w-[400px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] p-6 outline-none bg-[var(--menu-panel-bg)] shadow-[var(--menu-panel-shadow)]"
          onInteractOutside={() => onClose()}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>

          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="text-[15px] font-semibold text-[var(--text-heading)]">{title}</div>
            <div className="text-body text-[var(--text-tertiary)]">
              {t('changePassword.desc')}
            </div>
          </div>

          {errors.root && (
            <div className="mb-3 rounded-[8px] border border-[var(--danger-border)] bg-[var(--danger-bg)] px-3 py-2 text-body text-[var(--danger-text)]">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            {hasExistingPassword && (
              <div>
                <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">{t('changePassword.currentPassword')}</label>
                <input
                  {...register('currentPw')}
                  type="password"
                  placeholder={t('changePassword.currentPassword')}
                  autoComplete="current-password"
                  className={inputCls}
                />
                {errors.currentPw && <p className={fieldErrorCls}>{errors.currentPw.message}</p>}
              </div>
            )}
            <div>
              <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">
                {hasExistingPassword ? t('changePassword.enterNewPassword') : t('changePassword.newPassword')}
              </label>
              <input
                {...register('newPw')}
                type="password"
                placeholder={t('changePassword.newPassword')}
                autoComplete="new-password"
                className={inputCls}
              />
              {errors.newPw && <p className={fieldErrorCls}>{errors.newPw.message}</p>}
            </div>
            <div>
              <label className="mb-[5px] block text-body text-[var(--text-tertiary)]">{t('changePassword.confirmPassword')}</label>
              <input
                {...register('confirmPw')}
                type="password"
                placeholder={t('changePassword.confirmPlaceholder')}
                autoComplete="new-password"
                className={inputCls}
              />
              {errors.confirmPw && <p className={fieldErrorCls}>{errors.confirmPw.message}</p>}
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
                <div className="mt-1 text-2xs text-[var(--text-disabled)]">
                  {t('changePassword.strengthLabel')}{STRENGTH_LABELS[score] || '—'}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 w-full rounded-[7px] bg-[var(--accent-primary)] py-[9px] text-body font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isSubmitting ? t('changePassword.saving') : title}
            </button>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
