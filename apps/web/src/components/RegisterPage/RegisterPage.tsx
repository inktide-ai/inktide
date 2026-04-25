import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../LoadingScreen'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, isInitialized, registerWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      navigate('/home', { replace: true })
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      registerWithKeycloak()
    }
  }, [isInitialized, isLoggedIn, registerWithKeycloak, navigate])

  return <LoadingScreen message={isLoggedIn ? 'Completing sign up...' : 'Redirecting to sign up...'} />
}

export default RegisterPage
