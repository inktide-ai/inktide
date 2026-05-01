'use client'
import { useState, useCallback, useEffect } from 'react'
import type { LookAtMode } from '../components/AvatarRenderer/AvatarRenderer'

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

// ── Storage ───────────────────────────────────────────────────────────────────

function storageKey(cardId: string) {
  return `inktide_scene_settings_${cardId}`
}

function loadFromStorage(cardId: string): SceneRendererSettings {
  try {
    const raw = localStorage.getItem(storageKey(cardId))
    return raw ? { ...SCENE_RENDERER_DEFAULTS, ...JSON.parse(raw) } : SCENE_RENDERER_DEFAULTS
  } catch {
    return SCENE_RENDERER_DEFAULTS
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSceneRendererSettings(cardId: string) {
  const [settings, setSettingsState] = useState<SceneRendererSettings>(
    () => loadFromStorage(cardId),
  )

  // Reload when the active card changes
  useEffect(() => {
    setSettingsState(loadFromStorage(cardId))
  }, [cardId])

  const setSettings = useCallback(
    (patch: Partial<SceneRendererSettings>) => {
      setSettingsState((prev) => {
        const next = { ...prev, ...patch }
        localStorage.setItem(storageKey(cardId), JSON.stringify(next))
        return next
      })
    },
    [cardId],
  )

  const resetSettings = useCallback(() => {
    localStorage.removeItem(storageKey(cardId))
    setSettingsState(SCENE_RENDERER_DEFAULTS)
  }, [cardId])

  return { settings, setSettings, resetSettings }
}
