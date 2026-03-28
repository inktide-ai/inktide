import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BenefitsSection,
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
        onGoToApp={isLoggedIn ? () => navigate('/profile') : undefined}
      />
      <HeroChimera onSignUpClick={() => navigate('/register')} />
      <FeaturesSection />
      <BenefitsSection />
      <LearnSection />
      <VideoSection />
      <ProfileSection />
      <CTASection />
      <Footer />
    </>
  )
}

export default LandingPage
