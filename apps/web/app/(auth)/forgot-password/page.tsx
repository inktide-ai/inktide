'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEffect } from 'react'
import LoadingScreen from '@/components/LoadingScreen'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isLoggedIn, isInitialized } = useAuth()

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      router.replace('/home')
      return
    }
    keycloak_redirectToForgotPassword()
  }, [isInitialized, isLoggedIn, router])

  return <LoadingScreen message="Redirecting to password reset..." />
}

function keycloak_redirectToForgotPassword() {
  const url = (process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'http://localhost:8080') +
    '/realms/' + (process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'inktide-app') +
    '/login-actions/reset-credentials?client_id=' + (process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'inktide-web')
  window.location.href = url
}
