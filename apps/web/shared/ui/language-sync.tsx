'use client'

import { useEffect } from 'react'
import i18n from '@/i18n/i18n'
import { useGlobalPreferences } from '@/shared/hooks/useGlobalPreferences'

/**
 * Applies the server-stored language preference to i18next after global
 * preferences are fetched. Server is the source of truth - no guard on
 * current i18n language, so this wins over any other service that might
 * have set a different language (e.g. from Keycloak token locale).
 */
export function LanguageSync() {
  const { data } = useGlobalPreferences()

  useEffect(() => {
    const lang = data?.language
    if (!lang || !i18n.isInitialized) return
    void i18n.changeLanguage(lang)
  }, [data?.language])

  return null
}
