'use client'
import Link from 'next/link'
import PricingSection from '@/features/landing/pricing-section'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <div className="flex h-14 items-center px-6 border-b border-[var(--border-subtle)]">
        <Link href="/home" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Назад
        </Link>
      </div>
      <PricingSection plans={['starter', 'pro']} />
    </div>
  )
}
