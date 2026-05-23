'use client'

import { useEffect, useLayoutEffect } from 'react'
import { USER_APPEARANCE_STORAGE_KEY, syncUserAccentFromStorage } from '@/lib/user-appearance'

/**
 * Applies stored accent before paint after navigation, and when another tab updates preferences.
 */
export function UserAccentHydration() {
  useLayoutEffect(() => {
    syncUserAccentFromStorage()
  }, [])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== USER_APPEARANCE_STORAGE_KEY) return
      syncUserAccentFromStorage()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return null
}
