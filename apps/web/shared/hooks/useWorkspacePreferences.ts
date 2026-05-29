'use client'
import { useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkspacePreferences,
  patchWorkspacePreferences,
  type WorkspacePreferencesDto,
} from '@/api/preferences'
import { queryKeys } from '@/shared/lib/query/keys'

// ── Per-character localStorage warm cache ──────────────────────────────────────

function cacheKey(characterId: string) {
  return `inktide_workspace_prefs_cache_${characterId}`
}

function readCache(characterId: string): WorkspacePreferencesDto | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(cacheKey(characterId))
    if (raw) return JSON.parse(raw) as WorkspacePreferencesDto
  } catch { /* ignore */ }
  return undefined
}

function writeCache(characterId: string, data: WorkspacePreferencesDto) {
  try { localStorage.setItem(cacheKey(characterId), JSON.stringify(data)) } catch { /* quota */ }
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useWorkspacePreferences(characterId: string) {
  return useQuery({
    queryKey: queryKeys.me.preferences.workspace(characterId),
    queryFn: async () => {
      const data = await getWorkspacePreferences(characterId)
      writeCache(characterId, data)
      return data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    placeholderData: () => readCache(characterId),
    enabled: !!characterId,
  })
}

export function usePatchWorkspacePreferences(characterId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: Partial<WorkspacePreferencesDto>) =>
      patchWorkspacePreferences(characterId, patch),
    onMutate: async (patch) => {
      const qKey = queryKeys.me.preferences.workspace(characterId)
      await queryClient.cancelQueries({ queryKey: qKey })
      const prev = queryClient.getQueryData<WorkspacePreferencesDto>(qKey)
      if (prev) {
        const optimistic = { ...prev, ...patch }
        queryClient.setQueryData(qKey, optimistic)
        writeCache(characterId, optimistic)
      }
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) {
        const qKey = queryKeys.me.preferences.workspace(characterId)
        queryClient.setQueryData(qKey, ctx.prev)
        writeCache(characterId, ctx.prev)
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.me.preferences.workspace(characterId), data)
      writeCache(characterId, data)
    },
  })
}

/**
 * Debounced patch for workspace fields that change at high frequency (drag events).
 * Returns a stable dispatch function — safe to call on every animation frame.
 */
export function useDebouncedWorkspacePatch(characterId: string, delayMs: number) {
  const { mutate } = usePatchWorkspacePreferences(characterId)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<Partial<WorkspacePreferencesDto> | null>(null)

  return useCallback((patch: Partial<WorkspacePreferencesDto>) => {
    pendingRef.current = { ...pendingRef.current, ...patch }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      if (pendingRef.current) {
        mutate(pendingRef.current)
        pendingRef.current = null
      }
    }, delayMs)
  }, [mutate, delayMs])
}
