'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/services/auth'
import { SANDBOX_ROUTE } from '@/lib/routes'
import LoadingScreen from '@/shared/ui/loading-screen'

export default function RegisterPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { isLoggedIn, isInitialized, registerWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      router.replace(SANDBOX_ROUTE)
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      registerWithKeycloak()
    }
  }, [isInitialized, isLoggedIn, registerWithKeycloak, router])

  return <LoadingScreen message={isLoggedIn ? t('status.signingUp') : t('status.redirectingSignUp')} />
}
