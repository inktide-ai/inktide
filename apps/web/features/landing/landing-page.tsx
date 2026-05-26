import Navigation from '@/features/landing/navigation';
import HeroInktide from '@/features/landing/hero-inktide';
import PartnerLogos from '@/features/landing/partner-logos';
import PricingSection from '@/features/landing/pricing-section';
import Footer from '@/features/landing/footer';

export default function LandingPage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroInktide />
        <PartnerLogos />
        <PricingSection />
      </main>
      <Footer />
    </>
  );
}
