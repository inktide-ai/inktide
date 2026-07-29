'use client'
import { useEffect, useState } from 'react'
import type { ProjectSceneResponse } from '@/features/projects/api/scenes'
import { listProjectScenes } from '@/features/projects/api/scenes'
import { listProjects } from '@/entities/project/api'

interface SceneState {
  scenes: ProjectSceneResponse[]
  scene: ProjectSceneResponse | null  // scenes[0] ?? null - backward compat for ObsTab / SceneFullscreen
  projectId: string | null
  loading: boolean
  error: string | null
}

export function useCardScene(cardId: string | undefined, refreshKey = 0): SceneState {
  const [state, setState] = useState<SceneState>({ scenes: [], scene: null, projectId: null, loading: false, error: null })

  useEffect(() => {
    if (!cardId) return
    let cancelled = false
    setState(prev => ({ ...prev, loading: true, error: null }))
    ;(async () => {
      try {
        const projects = await listProjects(cardId)
        const projectId = projects[0]?.id ?? null
        if (!projectId) {
          if (!cancelled) setState({ scenes: [], scene: null, projectId: null, loading: false, error: null })
          return
        }
        const list = await listProjectScenes(projectId)
        if (!cancelled) {
          setState({ scenes: list, scene: list[0] ?? null, projectId, loading: false, error: null })
        }
      } catch (e) {
        if (!cancelled) {
          setState({ scenes: [], scene: null, projectId: null, loading: false, error: e instanceof Error ? e.message : 'Failed to load scene' })
        }
      }
    })()
    return () => { cancelled = true }
  }, [cardId, refreshKey])

  return state
}
