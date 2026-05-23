'use client'
import { useEffect, useState } from 'react'
import { listCardModels, type AiCardModelResponse } from '../../../api/soul'

interface ModelState {
  model: AiCardModelResponse | null
  loading: boolean
  error: string | null
}

export function useCardModel(cardId: string | undefined, refreshKey = 0): ModelState {
  const [state, setState] = useState<ModelState>({ model: null, loading: false, error: null })

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    setState({ model: null, loading: true, error: null })
    ;(async () => {
      try {
        const list = await listCardModels(cardId)
        if (!cancelled) {
          setState({ model: list.find(m => m.is_active) ?? list[0] ?? null, loading: false, error: null })
        }
      } catch (e) {
        if (!cancelled) {
          setState({ model: null, loading: false, error: e instanceof Error ? e.message : 'Failed to load model' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [cardId, refreshKey])

  return state
}
