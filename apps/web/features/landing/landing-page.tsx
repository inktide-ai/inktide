import Navigation from '@/features/landing/navigation'
import HeroInktide from '@/features/landing/hero-inktide'
import PartnerLogos from '@/features/landing/partner-logos'
import PricingSection from '@/features/landing/pricing-section'
import Footer from '@/features/landing/footer'
import { getServerUser } from '@/lib/auth-server'
import { fetchPriceLabels } from '@/entities/billing/api/plan-prices-server'

export default async function LandingPage() {
  const [serverUser, prices] = await Promise.all([getServerUser(), fetchPriceLabels()])
  return (
    <>
      <Navigation />
      <main>
        <HeroInktide />
        <PartnerLogos />
        <PricingSection prices={prices} isLoggedIn={!!serverUser} registerUrl="" />
      </main>
      <Footer />
    </>
  )
}
