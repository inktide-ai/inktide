'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/shared/services/auth'
import { SANDBOX_ROUTE } from '@/lib/routes'
import LoadingScreen from '@/shared/ui/loading-screen'

export default function LoginPage() {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { isLoggedIn, isInitialized, loginWithKeycloak } = useAuth()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized) return
    if (isLoggedIn) {
      router.replace(SANDBOX_ROUTE)
      return
    }
    if (!redirectedRef.current) {
      redirectedRef.current = true
      loginWithKeycloak()
    }
  }, [isInitialized, isLoggedIn, loginWithKeycloak, router])

  return <LoadingScreen message={isLoggedIn ? t('status.signingIn') : t('status.redirectingSignIn')} />
}
