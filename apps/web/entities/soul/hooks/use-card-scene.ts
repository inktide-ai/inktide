'use client'
import { useEffect, useState } from 'react'
import type { AiCardSceneResponse } from '@/shared/types/soul-api'
import { listCardScenes } from '@/entities/soul/api'

interface SceneState {
  scenes: AiCardSceneResponse[]
  scene: AiCardSceneResponse | null  // scenes[0] ?? null — backward compat for ObsTab / SceneFullscreen
  loading: boolean
  error: string | null
}

export function useCardScene(cardId: string | undefined, refreshKey = 0): SceneState {
  const [state, setState] = useState<SceneState>({ scenes: [], scene: null, loading: false, error: null })

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    setState(prev => ({ ...prev, loading: true, error: null }))
    ;(async () => {
      try {
        const list = await listCardScenes(cardId)
        if (!cancelled) {
          setState({ scenes: list, scene: list[0] ?? null, loading: false, error: null })
        }
      } catch (e) {
        if (!cancelled) {
          setState({ scenes: [], scene: null, loading: false, error: e instanceof Error ? e.message : 'Failed to load scene' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [cardId, refreshKey])

  return state
}
