'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from '@/shared/ui/loading-screen'

export default function LoginPage() {
  const router = useRouter()
  const { isLoggedIn, isInitialized, loginWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      router.replace('/edit/sandbox')
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      loginWithKeycloak()
    }
  }, [isInitialized, isLoggedIn, loginWithKeycloak, router])

  return <LoadingScreen message={isLoggedIn ? 'Completing sign in...' : 'Redirecting to sign in...'} />
}
