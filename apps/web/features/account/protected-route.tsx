'use client'

import { type ReactNode, useState, useLayoutEffect } from 'react'
import { redirect } from 'next/navigation'
import { useAuth } from '@/shared/services/auth'
import LoadingScreen from '@/shared/ui/loading-screen'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, isInitialized } = useAuth()
  // Must be state (not module-level) to avoid SSR/client hydration mismatch.
  // useLayoutEffect fires before paint so user never sees a flash of LoadingScreen.
  const [hasCachedSession, setHasCachedSession] = useState(false)

  useLayoutEffect(() => {
    setHasCachedSession(!!localStorage.getItem('inktide_session_hint'))
  }, [])

  if (!isInitialized) {
    return hasCachedSession ? <>{children}</> : <LoadingScreen />
  }

  if (!isLoggedIn) {
    redirect('/login')
  }

  return <>{children}</>
}
