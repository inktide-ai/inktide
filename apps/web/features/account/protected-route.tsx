'use client'

import { type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import LoadingScreen from '@/shared/ui/loading-screen'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoggedIn, isInitialized } = useAuth()

  if (!isInitialized) return <LoadingScreen />
  if (!isLoggedIn) {
    redirect('/login')
  }

  return <>{children}</>
}
