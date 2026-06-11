'use client'
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
import {
  getProjectSceneConfig,
  patchProjectSceneConfig,
} from '@/features/projects/api/projects'
import { queryKeys } from '@/shared/lib/query/keys'
import type { LookAtMode } from '@/shared/types/IVrmController'


export interface SceneRendererSettings {
  position:         { posX: number; posY: number; posZ: number; rotY: number }
  camera:           { fov: number; cameraDistance: number; renderScale: number; lookAtMode: LookAtMode }
  animations:       { randomAnimationsEnabled: boolean }
  breastPhysics:    { jiggleEnabled: boolean; jiggleMult: number }
  directionalLight: { intensity: number; color: string; rotX: number; rotY: number }
  ambientLight:     { intensity: number; color: string }
}


export const SCENE_RENDERER_DEFAULTS: SceneRendererSettings = {
  position:         { posX: 0, posY: 0, posZ: 0, rotY: 0 },
  camera:           { fov: 30, cameraDistance: 2.5, renderScale: 1.0, lookAtMode: 'camera' },
  animations:       { randomAnimationsEnabled: false },
  breastPhysics:    { jiggleEnabled: false, jiggleMult: 1.0 },
  directionalLight: { intensity: 1.0, color: '#ffffff', rotX: 30, rotY: 45 },
  ambientLight:     { intensity: 1.5, color: '#ffffff' },
}


export function useSceneRendererSettings(projectId: string) {
  const queryClient = useQueryClient()
  const qKey = queryKeys.projects.sceneConfig(projectId)

  const { data } = useQuery({
    queryKey: qKey,
    queryFn:  () => getProjectSceneConfig(projectId),
    enabled:  !!projectId,
    staleTime: 30_000,
  })

  const settings: SceneRendererSettings = (() => {
    try {
      const raw = data?.scene_config
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        const r = raw as Partial<SceneRendererSettings>
        return {
          position:         { ...SCENE_RENDERER_DEFAULTS.position,         ...(r.position         ?? {}) },
          camera:           { ...SCENE_RENDERER_DEFAULTS.camera,           ...(r.camera           ?? {}) },
          animations:       { ...SCENE_RENDERER_DEFAULTS.animations,       ...(r.animations       ?? {}) },
          breastPhysics:    { ...SCENE_RENDERER_DEFAULTS.breastPhysics,    ...(r.breastPhysics    ?? {}) },
          directionalLight: { ...SCENE_RENDERER_DEFAULTS.directionalLight, ...(r.directionalLight ?? {}) },
          ambientLight:     { ...SCENE_RENDERER_DEFAULTS.ambientLight,     ...(r.ambientLight     ?? {}) },
        }
      }
    } catch { /* ignore */ }
    return SCENE_RENDERER_DEFAULTS
  })()

  const { mutate } = useMutation({
    mutationFn: (patch: SceneRendererSettings) => patchProjectSceneConfig(projectId, patch),
    onMutate: async (optimistic) => {
      await queryClient.cancelQueries({ queryKey: qKey })
      const prev = queryClient.getQueryData(qKey)
      queryClient.setQueryData(qKey, (old: typeof data) => old ? { ...old, scene_config: optimistic } : old)
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev)
    },
  })

  const debouncedMutate = useDebouncedCallback((merged: SceneRendererSettings) => mutate(merged), 200)

  const setSettings = useCallback(
    (patch: Partial<SceneRendererSettings>) => {
      const merged = { ...settings }
      for (const key of Object.keys(patch) as (keyof SceneRendererSettings)[]) {
        merged[key] = { ...(settings[key] as object), ...(patch[key] as object) } as never
      }
      debouncedMutate(merged)
    },
    [debouncedMutate, settings],
  )

  const resetSettings = useCallback(() => {
    mutate(SCENE_RENDERER_DEFAULTS)
  }, [mutate])

  return { settings, setSettings, resetSettings }
}
