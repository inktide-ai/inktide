'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGlobalPreferences,
  patchGlobalPreferences,
  type GlobalPreferencesDto,
} from '@/api/preferences'
import { queryKeys } from '@/shared/lib/query/keys'
import { useAuth } from '@/shared/services/auth'


const CACHE_KEY = 'inktide_global_prefs_cache'
const MIGRATION_FLAG = 'prefs_migrated'

// Old localStorage keys that need to be migrated to the server.
const LEGACY_APPEARANCE_KEY = 'inktide_user_appearance'
const LEGACY_NOTIFICATIONS_KEY = 'inktide_user_notifications'
const LEGACY_FAVORITES_KEY = 'v1_inktide_favorites'
const LEGACY_LANG_KEY = 'inktide_lang'

function readCache(): GlobalPreferencesDto | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) return JSON.parse(raw) as GlobalPreferencesDto
  } catch { /* ignore */ }
  return undefined
}

function writeCache(data: GlobalPreferencesDto) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)) } catch { /* quota */ }
}

function collectLegacyPrefs(): Partial<GlobalPreferencesDto> | null {
  try {
    const appearance = localStorage.getItem(LEGACY_APPEARANCE_KEY)
    const notifications = localStorage.getItem(LEGACY_NOTIFICATIONS_KEY)
    const favoritesRaw = localStorage.getItem(LEGACY_FAVORITES_KEY)
    const language = localStorage.getItem(LEGACY_LANG_KEY)
    if (!appearance && !notifications && !favoritesRaw && !language) return null
    const patch: Partial<GlobalPreferencesDto> = {}
    if (appearance) patch.appearance = JSON.parse(appearance) as GlobalPreferencesDto['appearance']
    if (notifications) patch.notifications = JSON.parse(notifications) as GlobalPreferencesDto['notifications']
    if (favoritesRaw) patch.favorites = JSON.parse(favoritesRaw) as string[]
    if (language) patch.language = language
    return patch
  } catch { return null }
}

function deleteLegacyKeys() {
  try {
    localStorage.removeItem(LEGACY_APPEARANCE_KEY)
    localStorage.removeItem(LEGACY_NOTIFICATIONS_KEY)
    localStorage.removeItem(LEGACY_FAVORITES_KEY)
    // inktide_lang is NOT removed — i18next-browser-languagedetector reads it on
    // every page load for language detection. Deleting it causes the language to
    // reset to the browser's navigator language on reload.
  } catch { /* ignore */ }
}

async function fetchWithMigration(): Promise<GlobalPreferencesDto> {
  const data = await getGlobalPreferences()
  writeCache(data)

  // One-time migration: runs once per browser, guarded by the flag.
  if (typeof window !== 'undefined' && localStorage.getItem(MIGRATION_FLAG) !== '1') {
    const legacy = collectLegacyPrefs()
    if (legacy) {
      patchGlobalPreferences(legacy)
        .then((merged) => {
          localStorage.setItem(MIGRATION_FLAG, '1')
          deleteLegacyKeys()
          writeCache(merged)
        })
        .catch(() => { /* flag not set — retry next session, old data preserved */ })
    } else {
      localStorage.setItem(MIGRATION_FLAG, '1')
    }
  }

  return data
}


export function useGlobalPreferences() {
  const { isInitialized, isLoggedIn } = useAuth()
  return useQuery({
    queryKey: queryKeys.me.preferences.global,
    queryFn: fetchWithMigration,
    enabled: isInitialized && isLoggedIn,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    // Seed from localStorage immediately (zero-flicker before first network response)
    placeholderData: readCache,
  })
}

export function usePatchGlobalPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: patchGlobalPreferences,
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.me.preferences.global })
      const prev = queryClient.getQueryData<GlobalPreferencesDto>(queryKeys.me.preferences.global)
      if (prev) {
        const optimistic = { ...prev, ...patch }
        queryClient.setQueryData(queryKeys.me.preferences.global, optimistic)
        writeCache(optimistic)
      }
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(queryKeys.me.preferences.global, ctx.prev)
        writeCache(ctx.prev)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me.preferences.global, data)
      writeCache(data)
    },
  })
}
