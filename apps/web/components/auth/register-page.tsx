'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from '@/components/ui/loading-screen'

export default function RegisterPage() {
  const router = useRouter()
  const { isLoggedIn, isInitialized, registerWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      router.replace('/edit/sandbox')
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      registerWithKeycloak()
    }
  }, [isInitialized, isLoggedIn, registerWithKeycloak, router])

  return <LoadingScreen message={isLoggedIn ? 'Completing sign up...' : 'Redirecting to sign up...'} />
}
