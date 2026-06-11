import Navigation from '@/features/landing/navigation'
import HeroInktide from '@/features/landing/hero-inktide'
import PartnerLogos from '@/features/landing/partner-logos'
import PricingSection from '@/features/landing/pricing-section'
import Footer from '@/features/landing/footer'
import { getServerUser } from '@/lib/auth-server'

export default async function LandingPage() {
  const serverUser = await getServerUser()
  return (
    <>
      <Navigation />
      <main>
        <HeroInktide />
        <PartnerLogos />
        <PricingSection isLoggedIn={!!serverUser} registerUrl="" />
      </main>
      <Footer />
    </>
  )
}
