import type { Metadata } from 'next'
import Link from 'next/link'
import PricingSection from '@/features/landing/pricing-section'
import { HOME_ROUTE } from '@/lib/routes'
import { getServerUser } from '@/lib/auth-server'

export const metadata: Metadata = {
  title: 'Pricing — Inktide',
  description: 'Flexible plans for every creator.',
}

export default async function PricingPage() {
  const serverUser = await getServerUser()
  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      <div className="flex h-14 items-center px-6 border-b border-[var(--border-subtle)]">
        <Link href={HOME_ROUTE} className="text-body text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          ← Назад
        </Link>
      </div>
      <PricingSection
        plans={['starter', 'pro']}
        isLoggedIn={!!serverUser}
        registerUrl=""
      />
    </div>
  )
}
