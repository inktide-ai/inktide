import { useEffect } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import { createForgotCredentialsLoginUrl } from '../../keycloak'
import LoadingScreen from '../LoadingScreen'

const ForgotPasswordPage = () => {
  const { keycloak } = useKeycloak()

  useEffect(() => {
    if (!keycloak) return
    const redirectUri = `${window.location.origin}/home`
    void createForgotCredentialsLoginUrl(keycloak, redirectUri).then((url) => {
      window.location.assign(url)
    })
  }, [keycloak])

  return (
    <LoadingScreen message="Redirecting to password reset. You’ll enter your email on the Keycloak page." />
  )
}

export default ForgotPasswordPage
