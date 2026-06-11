'use client'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AvatarRenderer } from '@/features/avatar' // fsd:cross-feature-ok — OBS scene embeds avatar preview
import { useLipSync } from '@/shared/hooks/useLipSync'
import { useAudioStream } from '@/shared/hooks/useAudioStream'
import { SCENE_RENDERER_DEFAULTS, type SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { isRendererBridgeMessage } from '@/shared/lib/renderer-bridge'
import { getProjectSceneConfig } from '@/features/projects/api/projects'
import { queryKeys } from '@/shared/lib/query/keys'
import type { LookAtMode } from '@/shared/types/IVrmController'
import type { ModelType } from '@/shared/lib/character'
import './obs-scene.css'

//
// All configuration is passed via URL search params so the page works without
// any auth session (OBS Browser Source has no Keycloak context).
//
// Required:
//   modelUrl   — Public URL of the VRM/GLB/Live2D model asset (MinIO)
//   modelType  — 'vrm' | 'glb' | 'live2d'
//
// Optional (audio):
//   channelId  — Discord/platform channel ID to join in AudioHub (omit for silent preview)
//
// Optional:
//   projectId  — Project ID; when present, scene config is fetched from the public API
//                and kept fresh on window focus. Takes priority over settings/mood params.
//   sceneUrl   — Public URL of a background image (MinIO). Takes priority over bg.
//   bg         — CSS color or 'transparent' (default: 'transparent')
//   settings   — Fallback JSON-serialized SceneRendererSettings (used when projectId absent)
//   mood       — Fallback baselineMood string (used when projectId absent)


// Block RFC-1918, link-local, and loopback addresses.
const INTERNAL_IP = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|127\.|0\.0\.0\.0)/

const MODEL_EXTENSIONS = ['.vrm', '.glb', '.zip', '.moc3'] as const

/**
 * Validates a URL supplied via OBS scene params.
 * Rejects data:, javascript:, and any non-http(s) scheme.
 * Rejects RFC-1918 / link-local / loopback hostnames (prevent internal probing).
 * Returns the original string if valid, null otherwise.
 */
function validateObsUrl(raw: string | null, requireModelExtension = false): string | null {
  if (!raw) return null
  let url: URL
  try { url = new URL(raw) } catch { return null }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (INTERNAL_IP.test(url.hostname)) return null
  if (requireModelExtension) {
    const path = url.pathname.toLowerCase()
    if (!MODEL_EXTENSIONS.some(ext => path.endsWith(ext))) return null
  }
  return raw
}


const VALID_LOOK_AT_MODES: LookAtMode[] = ['idle', 'camera', 'mouse', 'disabled']
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function clamp(v: number, min: number, max: number): number {
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min
}

function safeColor(v: unknown, fallback: string): string {
  return typeof v === 'string' && HEX_COLOR.test(v) ? v : fallback
}

function parseLookAtMode(v: unknown): LookAtMode {
  return VALID_LOOK_AT_MODES.includes(v as LookAtMode) ? (v as LookAtMode) : 'camera'
}

function parseRendererSettings(raw: string | null): SceneRendererSettings {
  if (!raw) return SCENE_RENDERER_DEFAULTS
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    const pos  = (o.position         ?? {}) as Record<string, unknown>
    const cam  = (o.camera           ?? {}) as Record<string, unknown>
    const anim = (o.animations       ?? {}) as Record<string, unknown>
    const bp   = (o.breastPhysics    ?? {}) as Record<string, unknown>
    const dl   = (o.directionalLight ?? {}) as Record<string, unknown>
    const al   = (o.ambientLight     ?? {}) as Record<string, unknown>
    const d = SCENE_RENDERER_DEFAULTS
    return {
      position: {
        posX: clamp(Number(pos.posX), -3, 3),
        posY: clamp(Number(pos.posY), -3, 3),
        posZ: clamp(Number(pos.posZ), -3, 3),
        rotY: clamp(Number(pos.rotY),  0, 360),
      },
      camera: {
        fov:            clamp(Number(cam.fov),            10, 120),
        cameraDistance: clamp(Number(cam.cameraDistance), 0.5, 10),
        renderScale:    clamp(Number(cam.renderScale),    0.5, 3),
        lookAtMode:     parseLookAtMode(cam.lookAtMode),
      },
      animations: {
        randomAnimationsEnabled: Boolean(anim.randomAnimationsEnabled),
      },
      breastPhysics: {
        jiggleEnabled: Boolean(bp.jiggleEnabled),
        jiggleMult:    clamp(Number(bp.jiggleMult ?? d.breastPhysics.jiggleMult), 0.5, 3),
      },
      directionalLight: {
        intensity: clamp(Number(dl.intensity ?? d.directionalLight.intensity), 0, 5),
        color:     safeColor(dl.color, d.directionalLight.color),
        rotX:      clamp(Number(dl.rotX ?? d.directionalLight.rotX), 0, 360),
        rotY:      clamp(Number(dl.rotY ?? d.directionalLight.rotY), 0, 360),
      },
      ambientLight: {
        intensity: clamp(Number(al.intensity ?? d.ambientLight.intensity), 0, 5),
        color:     safeColor(al.color, d.ambientLight.color),
      },
    }
  } catch {
    return SCENE_RENDERER_DEFAULTS
  }
}

const VALID_MOODS = [
  'neutral', 'happy', 'chill', 'melancholic', 'hyped',
  'calm', 'sad', 'sleepy', 'thinking', 'angry', 'shy', 'confident', 'excited', 'sarcastic',
]

function parseMood(raw: string | null): string {
  return raw && VALID_MOODS.includes(raw) ? raw : 'neutral'
}


interface ObsConfig {
  projectId: string | null
  channelId: string | null
  modelUrl: string | null
  modelType: ModelType
  background: string
  fallbackSettings: SceneRendererSettings
  fallbackMood: string
}

function useObsConfig(): ObsConfig {
  const p = useSearchParams()
  const rawSceneUrl = p.get('sceneUrl')
  const bg = p.get('bg') ?? 'transparent'
  const sceneUrl = validateObsUrl(rawSceneUrl)
  return {
    projectId:        p.get('projectId'),
    channelId:        p.get('channelId'),
    modelUrl:         validateObsUrl(p.get('modelUrl'), true),
    modelType:        (p.get('modelType') ?? 'vrm') as ModelType,
    background:       sceneUrl ?? bg,
    fallbackSettings: parseRendererSettings(p.get('settings')),
    fallbackMood:     parseMood(p.get('mood')),
  }
}


export default function ObsScenePage() {
  const { projectId, channelId, modelUrl, modelType, background, fallbackSettings, fallbackMood } = useObsConfig()

  const { data: remoteConfig } = useQuery({
    queryKey: queryKeys.projects.sceneConfig(projectId ?? ''),
    queryFn:  () => getProjectSceneConfig(projectId!),
    enabled:  !!projectId,
    // staleTime: 0 (default) — refetch on every mount + window focus.
    // OBS Browser Source runs for hours; streamer changes settings in Sandbox
    // → OBS picks up on next focus/re-activate without manual reload.
  })

  const [rendererSettings, setRendererSettings] = useState<SceneRendererSettings>(
    remoteConfig?.scene_config ?? fallbackSettings
  )
  const [baselineMood, setBaselineMood] = useState<string>(
    remoteConfig?.baseline_mood ?? fallbackMood
  )

  // Apply remote config once it loads (covers the case where query resolves after mount)
  useEffect(() => {
    if (remoteConfig?.scene_config) setRendererSettings(remoteConfig.scene_config)
    if (remoteConfig?.baseline_mood) setBaselineMood(remoteConfig.baseline_mood)
  }, [remoteConfig])

  // Live updates from parent window via postMessage (e.g. Sandbox slider drag)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (!isRendererBridgeMessage(e.data)) return
      setRendererSettings(e.data.settings)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const lipSync = useLipSync()
  const { getEmotionState, getSoulState } = useAudioStream(channelId, { lipSync })

  if (!modelUrl) {
    return (
      <div className="obs-error">
        <p>OBS Scene — missing required URL params.</p>
        <p>
          Expected: <code>?modelUrl=&lt;url&gt;&amp;modelType=vrm|glb|live2d</code>
        </p>
      </div>
    )
  }

  return (
    <div className="obs-root">
      <AvatarRenderer
        modelType={modelType}
        modelUrl={modelUrl}
        background={background}
        className="obs-fill"
        getMouthWeights={lipSync.getMouthWeights}
        getEmotionState={getEmotionState}
        getSoulState={getSoulState}
        rendererSettings={rendererSettings}
        baselineMood={baselineMood}
      />
    </div>
  )
}
