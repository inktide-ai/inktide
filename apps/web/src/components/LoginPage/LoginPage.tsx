import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../LoadingScreen'

const LoginPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, isInitialized, loginWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      navigate('/home', { replace: true })
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      loginWithKeycloak()
    }
  }, [isInitialized, isLoggedIn, loginWithKeycloak, navigate])

  return <LoadingScreen message={isLoggedIn ? 'Completing sign in...' : 'Redirecting to sign in...'} />
}

export default LoginPage
