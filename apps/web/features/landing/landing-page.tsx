import Navigation from '@/components/landing/navigation';
import HeroInktide from '@/components/landing/hero-inktide';
import PartnerLogos from '@/components/landing/partner-logos';
import PricingSection from '@/components/landing/pricing-section';
import Footer from '@/components/landing/footer';

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
