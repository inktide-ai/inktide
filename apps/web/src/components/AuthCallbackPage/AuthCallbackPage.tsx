import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../LoadingScreen'

const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { isLoggedIn, isInitialized } = useAuth()

  useEffect(() => {
    if (!isInitialized) return

    if (isLoggedIn) {
      navigate('/profile', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [isInitialized, isLoggedIn, navigate])

  return <LoadingScreen message="Completing sign in..." />
}

export default AuthCallbackPage
