import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CTASection,
  HeroInktide,
  Navigation,
  SplitSection,
} from '../'
import FooterTw from '../Footer/FooterTw'
import { useAuth } from '../../context/AuthContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [scrollToHash, setScrollToHash] = useState<string | null>(null)

  useEffect(() => {
    if (!scrollToHash) return
    const id = scrollToHash.replace('#', '')
    setScrollToHash(null)
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    return () => clearTimeout(t)
  }, [scrollToHash])

  const handleGoToLanding = (hash?: string) => {
    if (hash) setScrollToHash(hash)
  }

  return (
    <>
      <Navigation
        onLoginClick={() => navigate('/login')}
        onRegisterClick={() => navigate('/register')}
        onGoToLanding={isLoggedIn ? handleGoToLanding : undefined}
        onGoToApp={isLoggedIn ? () => navigate('/home') : undefined}
      />
      <HeroInktide onSignUpClick={() => navigate('/register')} />
      <SplitSection
        heading={<>Your AI streamer,<br />live in minutes</>}
        description="Drop a reactive AI avatar into any broadcast. It reads chat, understands context, and responds with a real voice — no human in the loop, no scripts to maintain."
        reverse
        imageDark="/images/code/ts-dark.png"
        imageAlt="Inktide SDK — embed an AI streamer in a few lines of TypeScript"
      />
      <SplitSection
        heading={<>Seven-stage pipeline<br />under the hood</>}
        description="Every chat message triggers a parallel scatter-gather — context, emotion, memory, decision, and voice synthesis fire together. Your AI reacts before the next message arrives."
        imageDark="/images/code/api-dark.png"
        imageAlt="Inktide API — synapse pipeline and TTS synthesis"
      />
      <CTASection />
      <FooterTw />
    </>
  )
}

export default LandingPage
