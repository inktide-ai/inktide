'use client'
import { useCallback } from 'react'
import { useWorkspacePreferences, useDebouncedWorkspacePatch } from './useWorkspacePreferences'

export type HubTabId =
  | 'profile' | 'skills' | 'avatars' | 'scene' | 'memory'
  | 'brain' | 'voice' | 'connection' | 'obs'
  | 'emotion'

export interface CardLayout {
  i: HubTabId
  x: number
  y: number
  w: number
  h: number
}

export const DEFAULT_LAYOUT: CardLayout[] = [
  { i: 'profile',    x: 0, y: 0, w: 2, h: 2 },
  { i: 'avatars',    x: 2, y: 0, w: 1, h: 1 },
  { i: 'scene',      x: 3, y: 0, w: 1, h: 1 },
  { i: 'memory',     x: 2, y: 1, w: 1, h: 1 },
  { i: 'brain',      x: 3, y: 1, w: 1, h: 1 },
  { i: 'skills',     x: 0, y: 2, w: 1, h: 2 },
  { i: 'voice',      x: 1, y: 2, w: 1, h: 1 },
  { i: 'connection', x: 2, y: 2, w: 1, h: 1 },
  { i: 'obs',        x: 3, y: 2, w: 1, h: 2 },
]

const ALL_IDS = new Set(DEFAULT_LAYOUT.map(d => d.i))

export const SOUL_DEFAULT_LAYOUT: CardLayout[] = [
  { i: 'profile',  x: 0, y: 0, w: 2, h: 2 },
  { i: 'brain',    x: 2, y: 0, w: 1, h: 1 },
  { i: 'voice',    x: 3, y: 0, w: 1, h: 1 },
  { i: 'avatars',  x: 2, y: 1, w: 1, h: 1 },
  { i: 'scene',    x: 3, y: 1, w: 1, h: 1 },
  { i: 'emotion',  x: 0, y: 2, w: 1, h: 1 },
]

const SOUL_IDS = new Set(SOUL_DEFAULT_LAYOUT.map(d => d.i))

function isValidSoulLayout(parsed: unknown): parsed is CardLayout[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return false
  return parsed.every(
    item =>
      item && typeof item === 'object' &&
      typeof item.i === 'string' && SOUL_IDS.has(item.i as HubTabId) &&
      typeof item.x === 'number' && typeof item.y === 'number' &&
      typeof item.w === 'number' && typeof item.h === 'number' &&
      item.w >= 1 && item.h >= 1
  )
}

function isValidLayout(parsed: unknown): parsed is CardLayout[] {
  if (!Array.isArray(parsed) || parsed.length !== DEFAULT_LAYOUT.length) return false
  return parsed.every(
    item =>
      item && typeof item === 'object' &&
      typeof item.i === 'string' && ALL_IDS.has(item.i as HubTabId) &&
      typeof item.x === 'number' && typeof item.y === 'number' &&
      typeof item.w === 'number' && typeof item.h === 'number' &&
      item.w >= 1 && item.h >= 1
  )
}

// Soul hub uses the workspace preferences keyed by soulId.

export function useSoulHubLayout(soulId: string) {
  const { data } = useWorkspacePreferences(soulId)
  const dispatch = useDebouncedWorkspacePatch(soulId, 500)

  const layout: CardLayout[] = (() => {
    try {
      const raw = data?.hubLayout
      if (raw && isValidSoulLayout(raw)) return raw as CardLayout[]
    } catch { /* ignore */ }
    return SOUL_DEFAULT_LAYOUT
  })()

  const updateLayout = useCallback((newLayout: CardLayout[]) => {
    dispatch({ hubLayout: newLayout })
  }, [dispatch])

  const resetLayout = useCallback(() => {
    dispatch({ hubLayout: SOUL_DEFAULT_LAYOUT })
  }, [dispatch])

  return { layout, updateLayout, resetLayout }
}


export function useHubLayout(characterId: string) {
  const { data } = useWorkspacePreferences(characterId)
  const dispatch = useDebouncedWorkspacePatch(characterId, 500)

  const layout: CardLayout[] = (() => {
    try {
      const raw = data?.hubLayout
      if (raw && isValidLayout(raw)) return raw as CardLayout[]
    } catch { /* ignore */ }
    return DEFAULT_LAYOUT
  })()

  const updateLayout = useCallback((newLayout: CardLayout[]) => {
    dispatch({ hubLayout: newLayout })
  }, [dispatch])

  const resetLayout = useCallback(() => {
    dispatch({ hubLayout: DEFAULT_LAYOUT })
  }, [dispatch])

  return { layout, updateLayout, resetLayout }
}
