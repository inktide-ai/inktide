import { useMemo } from 'react'
import AvatarRenderer from '../../components/AvatarRenderer/AvatarRenderer'
import { useLipSync } from '../../hooks/useLipSync'
import { useAudioStream } from '../../hooks/useAudioStream'
import type { ModelType } from '../../domain/character'
import './obs-scene.css'

// ── Config ────────────────────────────────────────────────────────────────────
//
// All configuration is passed via URL search params so the page works without
// any auth session (OBS Browser Source has no Keycloak context).
//
// Required:
//   channelId  — Discord/platform channel ID to join in AudioHub
//   modelUrl   — Public URL of the VRM/GLB/Live2D model asset (MinIO)
//   modelType  — 'vrm' | 'glb' | 'live2d'
//
// Optional:
//   sceneUrl   — Public URL of a background image (MinIO). Takes priority over bg.
//   bg         — CSS color or 'transparent' (default: 'transparent')
//
// Example URL generated from the app and pasted into OBS Browser Source:
//   http://localhost:5173/obs/scene?channelId=123&modelUrl=https://...&modelType=vrm

interface ObsConfig {
  channelId: string | null
  modelUrl: string | null
  modelType: ModelType
  /** Resolved background: sceneUrl if present, else bg param, else 'transparent'. */
  background: string
}

function useObsConfig(): ObsConfig {
  return useMemo(() => {
    const p = new URLSearchParams(window.location.search)
    const sceneUrl = p.get('sceneUrl')
    const bg = p.get('bg') ?? 'transparent'
    return {
      channelId: p.get('channelId'),
      modelUrl: p.get('modelUrl'),
      modelType: (p.get('modelType') ?? 'vrm') as ModelType,
      background: sceneUrl ?? bg,
    }
  }, [])
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ObsScenePage() {
  const { channelId, modelUrl, modelType, background } = useObsConfig()

  // Audio pipeline — renderer-agnostic. MouthWeights flow down as a callback,
  // so swapping AvatarRenderer internals (three.js → anything) has zero impact here.
  const lipSync = useLipSync()
  useAudioStream(channelId, { lipSync })

  if (!channelId || !modelUrl) {
    return (
      <div className="obs-error">
        <p>OBS Scene — missing required URL params.</p>
        <p>
          Expected: <code>?channelId=&lt;id&gt;&amp;modelUrl=&lt;url&gt;&amp;modelType=vrm|glb|live2d</code>
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
      />
    </div>
  )
}
