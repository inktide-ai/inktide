import Navigation from '@/components/Navigation'
import HeroInktide from '@/components/HeroInktide'
import PartnerLogos from '@/components/PartnerLogos'
import SplitSection from '@/components/SplitSection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <>
      <Navigation />
      <main>
        <HeroInktide />
        <div className="mt-12 mb-12 pt-4 pb-4 [@media(max-height:950px)]:mb-6 max-lg:pt-8 max-md:pt-6 max-md:pb-6">
          <PartnerLogos />
        </div>
        <SplitSection
          heading={<>Your AI streamer,<br />live in minutes</>}
          description="Drop a reactive AI avatar into any broadcast. It reads chat, understands context, and responds with a real voice — no human in the loop, no scripts to maintain."
          reverse
          imageDark="/images/code/ts-dark.png"
          imageAlt="Inktide SDK"
        />
        <SplitSection
          heading={<>Seven-stage pipeline<br />under the hood</>}
          description="Every chat message triggers a parallel scatter-gather — context, emotion, memory, decision, and voice synthesis fire together. Your AI reacts before the next message arrives."
          imageDark="/images/code/api-dark.png"
          imageAlt="Inktide API"
        />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
