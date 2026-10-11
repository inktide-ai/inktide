import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import PricingPage from '@/features/landing/stage/pricing-page'
import { getServerUser } from '@/lib/auth-server'
import { fetchPriceLabels } from '@/entities/billing/api/plan-prices-server'

export const metadata: Metadata = {
  title: { absolute: 'Pricing — Quackie' },
  description: "Plans for every creator. Start free, upgrade when you're ready.",
}

export default async function Pricing() {
  const [serverUser, prices] = await Promise.all([getServerUser(), fetchPriceLabels()])
  return (
    <main className={GeistMono.variable}>
      <PricingPage prices={prices} isLoggedIn={!!serverUser} />
    </main>
  )
}
