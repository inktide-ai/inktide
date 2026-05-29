'use client'

import { useEffect, useLayoutEffect } from 'react'
import { USER_APPEARANCE_STORAGE_KEY, syncUserAccentFromStorage, applyUserAccent } from '@/shared/lib/user-appearance'
import { useGlobalPreferences } from '@/shared/hooks/useGlobalPreferences'

/**
 * Applies stored accent before paint after navigation (from localStorage cache),
 * then syncs from the server value when it arrives, and keeps cross-tab in sync.
 */
export function UserAccentHydration() {
  // Zero-flicker paint: apply localStorage value before first render.
  useLayoutEffect(() => {
    syncUserAccentFromStorage()
  }, [])

  // Cross-tab sync via StorageEvent (same browser, different tab).
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== USER_APPEARANCE_STORAGE_KEY) return
      syncUserAccentFromStorage()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Server sync: when server value arrives, apply if different from cache.
  const { data } = useGlobalPreferences()
  useEffect(() => {
    if (data?.appearance?.accentColor) {
      applyUserAccent(data.appearance.accentColor)
    }
  }, [data?.appearance?.accentColor])

  return null
}
