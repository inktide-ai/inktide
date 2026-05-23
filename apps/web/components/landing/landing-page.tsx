import Navigation from '@/components/landing/navigation';
import HeroInktide from '@/components/landing/hero-inktide';
import PartnerLogos from '@/components/landing/partner-logos';
import SplitSection from '@/components/landing/split-section';
import CTASection from '@/components/landing/cta-section';
import Footer from '@/components/landing/footer';

export default function LandingPage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroInktide />
        <PartnerLogos />
        <SplitSection
          heading={
            <>
              Your AI streamer,
              <br />
              live in minutes
            </>
          }
          description="Drop a reactive AI avatar into any broadcast. It reads chat, understands context, and responds with a real voice — no human in the loop, no scripts to maintain."
          reverse={true}
          imageDark="/images/code/ts-dark.png"
          imageAlt="Inktide SDK"
        />
        <SplitSection
          heading={
            <>
              Seven-stage pipeline
              <br />
              under the hood
            </>
          }
          description="Every chat message triggers a parallel scatter-gather — context, emotion, memory, decision, and voice synthesis fire together. Your AI reacts before the next message arrives."
          imageDark="/images/code/api-dark.png"
          imageAlt="Inktide API"
        />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
