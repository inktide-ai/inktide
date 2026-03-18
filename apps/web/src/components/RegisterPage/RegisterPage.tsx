import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKeycloak } from '@react-keycloak/web'
import { useAuth } from '../../context/AuthContext'
import LoadingScreen from '../LoadingScreen'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { keycloak, initialized } = useKeycloak()
  const { isLoggedIn, registerWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!initialized) return
    if (isLoggedIn || keycloak.authenticated) {
      navigate('/profile', { replace: true })
      return
    }
    const params = new URLSearchParams(window.location.search)
    if (params.has('code') || params.has('state')) {
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      registerWithKeycloak()
    }
  }, [initialized, isLoggedIn, keycloak.authenticated, registerWithKeycloak, navigate])

  const message = initialized
    ? keycloak.authenticated
      ? 'Completing sign up...'
      : 'Redirecting to sign up...'
    : 'Loading...'

  return <LoadingScreen message={message} />
}

export default RegisterPage
