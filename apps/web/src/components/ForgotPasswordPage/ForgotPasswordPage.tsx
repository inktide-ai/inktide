import { useEffect } from 'react'
import { useKeycloak } from '@react-keycloak/web'
import LoadingScreen from '../LoadingScreen'

const ForgotPasswordPage = () => {
  const { keycloak } = useKeycloak()

  useEffect(() => {
    keycloak?.login()
  }, [keycloak])

  return (
    <LoadingScreen
      message='Redirecting to sign in. Use "Forgot password?" on the login page.'
    />
  )
}

export default ForgotPasswordPage
