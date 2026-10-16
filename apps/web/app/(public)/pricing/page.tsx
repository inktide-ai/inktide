import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import PricingPage from '@/features/landing/stage/pricing-page'
import { getServerUser } from '@/lib/auth-server'
import { getTranslations } from '@/lib/i18n-server'
import { fetchPriceLabels } from '@/entities/billing/api/plan-prices-server'

export async function generateMetadata(): Promise<Metadata> {
  const [common, landing] = await Promise.all([getTranslations('common'), getTranslations('landing')])
  return { title: common('meta.pricing'), description: landing('pricing.subtitle') }
}

export default async function Pricing() {
  const [serverUser, prices] = await Promise.all([getServerUser(), fetchPriceLabels()])
  return (
    <main className={GeistMono.variable}>
      <PricingPage prices={prices} isLoggedIn={!!serverUser} />
    </main>
  )
}
