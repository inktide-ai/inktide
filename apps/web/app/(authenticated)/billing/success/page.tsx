'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useBilling } from '@/entities/billing'

export default function BillingSuccessPage() {
  const { t } = useTranslation('common')
  const { refresh } = useBilling()

  useEffect(() => {
    // Refresh billing state after successful checkout
    void refresh()
  }, [refresh])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-emerald-400" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <div>
        <h1 className="text-[1.75rem] font-bold tracking-[-0.02em] text-[var(--text-heading)]">
          {t('billing.welcomeToPro')}
        </h1>
        <p className="mt-2 max-w-sm text-body-md text-[var(--text-secondary)]">
          {t('billing.subscriptionActive')}
        </p>
      </div>

      <Link
        href="/"
        className="rounded-xl bg-[var(--accent-primary)] px-6 py-2.5 text-body font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t('billing.backToApp')}
      </Link>
    </div>
  )
}
