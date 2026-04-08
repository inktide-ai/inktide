import { useEffect, useState } from 'react'
import { listCardScenes, type AiCardSceneResponse } from '../../../api/soul'

interface SceneState {
  scene: AiCardSceneResponse | null
  loading: boolean
  error: string | null
}

export function useCardScene(cardId: string | undefined, refreshKey = 0): SceneState {
  const [state, setState] = useState<SceneState>({ scene: null, loading: false, error: null })

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    setState({ scene: null, loading: true, error: null })
    ;(async () => {
      try {
        const list = await listCardScenes(cardId)
        if (!cancelled) {
          setState({ scene: list[0] ?? null, loading: false, error: null })
        }
      } catch (e) {
        if (!cancelled) {
          setState({ scene: null, loading: false, error: e instanceof Error ? e.message : 'Failed to load scene' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [cardId, refreshKey])

  return state
}
