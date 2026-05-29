'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/services/auth'
import { useEffect } from 'react'
import { SANDBOX_ROUTE } from '@/lib/routes'
import LoadingScreen from '@/shared/ui/loading-screen'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isLoggedIn, isInitialized } = useAuth()

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      router.replace(SANDBOX_ROUTE)
      return
    }
    keycloak_redirectToForgotPassword()
  }, [isInitialized, isLoggedIn, router])

  return <LoadingScreen message="Redirecting to password reset..." />
}

function keycloak_redirectToForgotPassword() {
  const url = process.env.NEXT_PUBLIC_KEYCLOAK_URL! +
    '/realms/' + process.env.NEXT_PUBLIC_KEYCLOAK_REALM! +
    '/login-actions/reset-credentials?client_id=' + process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!
  window.location.href = url
}
