import { useState, useEffect } from 'react'
import {
  BenefitsSection,
  ChimeraApp,
  CTASection,
  FeaturesSection,
  HeroChimera,
  Navigation,
  ProfileSection,
  VideoSection,
} from '../'
import { useAuth } from '../../context/AuthContext'

const LandingPage = () => {
  const { isLoggedIn } = useAuth()
  const [showRegister, setShowRegister] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
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
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
        showLogin={showLogin}
        setShowLogin={setShowLogin}
        showRegister={showRegister}
        setShowRegister={setShowRegister}
        onGoToLanding={isLoggedIn ? handleGoToLanding : undefined}
        onGoToApp={isLoggedIn ? handleGoToApp : undefined}
      />
      {showLanding ? (
        <>
          <HeroChimera onSignUpClick={() => setShowRegister(true)} />
          <FeaturesSection />
          <BenefitsSection />
          <VideoSection />
          <ProfileSection />
          <CTASection />
        </>
      ) : (
        <ChimeraApp />
      )}
    </>
  )
}

export default LandingPage
