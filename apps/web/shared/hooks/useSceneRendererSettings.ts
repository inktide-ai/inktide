'use client'
import { useCallback } from 'react'
import type { LookAtMode } from '@/shared/types/IVrmController'
import { useWorkspacePreferences, useDebouncedWorkspacePatch } from './useWorkspacePreferences'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SceneRendererSettings {
  // Model transform
  posX: number
  posY: number
  posZ: number
  rotY: number           // degrees 0–360
  // Camera
  fov: number            // degrees 10–120
  cameraDistance: number // 0.5–10
  renderScale: number    // 0.5–3.0
  // Eye tracking
  lookAtMode: LookAtMode
  // Directional light
  dirLightIntensity: number  // 0–5
  dirLightColor: string      // hex
  dirLightRotX: number       // degrees 0–360
  dirLightRotY: number       // degrees 0–360
  // Ambient light
  ambientIntensity: number   // 0–5
  ambientColor: string       // hex
}

// ── Defaults (must match VrmRenderer initial Three.js state) ──────────────────

export const SCENE_RENDERER_DEFAULTS: SceneRendererSettings = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: 0,
  fov: 30,
  cameraDistance: 2.5,
  renderScale: 1.0,
  lookAtMode: 'idle',
  dirLightIntensity: 1.0,
  dirLightColor: '#ffffff',
  dirLightRotX: 30,
  dirLightRotY: 45,
  ambientIntensity: 1.5,
  ambientColor: '#ffffff',
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSceneRendererSettings(cardId: string) {
  const { data } = useWorkspacePreferences(cardId)
  const dispatch = useDebouncedWorkspacePatch(cardId, 200)

  const settings: SceneRendererSettings = (() => {
    try {
      const raw = data?.sceneSettings
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return { ...SCENE_RENDERER_DEFAULTS, ...(raw as Partial<SceneRendererSettings>) }
      }
    } catch { /* ignore */ }
    return SCENE_RENDERER_DEFAULTS
  })()

  const setSettings = useCallback(
    (patch: Partial<SceneRendererSettings>) => {
      dispatch({ sceneSettings: { ...settings, ...patch } })
    },
    [dispatch, settings],
  )

  const resetSettings = useCallback(() => {
    dispatch({ sceneSettings: SCENE_RENDERER_DEFAULTS })
  }, [dispatch])

  return { settings, setSettings, resetSettings }
}
