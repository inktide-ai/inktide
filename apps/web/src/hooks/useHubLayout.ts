import { useState, useCallback } from 'react'

export type HubTabId =
  | 'profile' | 'skills' | 'avatars' | 'scene' | 'memory'
  | 'brain' | 'voice' | 'connection' | 'obs' | 'backup'

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
  { i: 'backup',     x: 1, y: 3, w: 2, h: 1 },
]

const ALL_IDS = new Set(DEFAULT_LAYOUT.map(d => d.i))

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

export function useHubLayout(characterId: string) {
  const key = `chimera_hub_layout_${characterId}`

  const [layout, setLayout] = useState<CardLayout[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (isValidLayout(parsed)) return parsed
      }
    } catch { /* ignore */ }
    return DEFAULT_LAYOUT
  })

  const updateLayout = useCallback((newLayout: CardLayout[]) => {
    setLayout(newLayout)
    try { localStorage.setItem(key, JSON.stringify(newLayout)) } catch { /* quota */ }
  }, [key])

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
    try { localStorage.removeItem(key) } catch { /* quota */ }
  }, [key])

  return { layout, updateLayout, resetLayout }
}
