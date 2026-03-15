import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BenefitsSection,
  ChimeraApp,
  CTASection,
  FeaturesSection,
  Footer,
  HeroChimera,
  LearnSection,
  Navigation,
  ProfileSection,
  VideoSection,
} from '../'
import { useAuth } from '../../context/AuthContext'

const LandingPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()
  const [showAppView, setShowAppView] = useState(true)
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
    setShowAppView(false)
    if (hash) setScrollToHash(hash)
  }

  const handleGoToApp = () => {
    setShowAppView(true)
  }

  const showLanding = !isLoggedIn || !showAppView

  return (
    <>
      <Navigation
        onLoginClick={() => navigate('/login')}
        onRegisterClick={() => navigate('/register')}
        onGoToLanding={isLoggedIn ? handleGoToLanding : undefined}
        onGoToApp={isLoggedIn ? handleGoToApp : undefined}
      />
      {showLanding ? (
        <>
          <HeroChimera onSignUpClick={() => navigate('/register')} />
          <FeaturesSection />
          <BenefitsSection />
          <LearnSection />
          <VideoSection />
          <ProfileSection />
          <CTASection />
          <Footer />
        </>
      ) : (
        <ChimeraApp />
      )}
    </>
  )
}

export default LandingPage
