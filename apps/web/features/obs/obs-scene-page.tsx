'use client'
import { useSearchParams } from 'next/navigation'
import { AvatarRenderer } from '@/features/avatar' // fsd:cross-feature-ok — OBS scene embeds avatar preview
import { useLipSync } from '@/shared/hooks/useLipSync'
import { useAudioStream } from '@/shared/hooks/useAudioStream'
import type { ModelType } from '@/shared/lib/character'
import './obs-scene.css'

// ── Config ────────────────────────────────────────────────────────────────────
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
//   sceneUrl   — Public URL of a background image (MinIO). Takes priority over bg.
//   bg         — CSS color or 'transparent' (default: 'transparent')
//
// Example URL generated from the app and pasted into OBS Browser Source:
//   http://localhost:5173/obs/scene?channelId=123&modelUrl=https://...&modelType=vrm

// ── URL validation ────────────────────────────────────────────────────────────

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

interface ObsConfig {
  channelId: string | null
  modelUrl: string | null
  modelType: ModelType
  /** Resolved background: sceneUrl if present, else bg param, else 'transparent'. */
  background: string
}

function useObsConfig(): ObsConfig {
  const p = useSearchParams()
  const rawSceneUrl = p.get('sceneUrl')
  const bg = p.get('bg') ?? 'transparent'
  const sceneUrl = validateObsUrl(rawSceneUrl)
  return {
    channelId: p.get('channelId'),
    modelUrl: validateObsUrl(p.get('modelUrl'), true),
    modelType: (p.get('modelType') ?? 'vrm') as ModelType,
    background: sceneUrl ?? bg,
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ObsScenePage() {
  const { channelId, modelUrl, modelType, background } = useObsConfig()

  // Audio pipeline — renderer-agnostic. MouthWeights flow down as a callback,
  // so swapping AvatarRenderer internals (three.js → anything) has zero impact here.
  const lipSync = useLipSync()
  const { getEmotionState } = useAudioStream(channelId, { lipSync })

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
      />
    </div>
  )
}
