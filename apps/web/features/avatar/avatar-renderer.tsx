import { lazy, Suspense } from 'react'
import { cn } from '@/lib/utils'
import type { ModelType } from '@/shared/lib/character'
import type { MouthWeights } from '@/shared/hooks/useLipSync'
import type { LookAtMode } from './renderers/vrm-renderer'
import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import type { EmotionState } from '@/shared/types/IVrmController'

// Lazy-load heavy renderers — three.js is ~600KB, don't load until needed
const VrmRenderer   = lazy(() => import('./renderers/vrm-renderer'))
const GlbRenderer   = lazy(() => import('./renderers/glb-renderer'))
const Live2dRenderer = lazy(() => import('./renderers/live2d-renderer'))

export type { LookAtMode }
export type { SceneRendererSettings }

export interface AvatarRendererProps {
  modelType: ModelType
  modelUrl: string | null
  /** 'transparent' for future RTMP overlay, hex/named color for studio preview */
  background?: string
  className?: string
  /**
   * Called every animation frame to obtain current mouth expression weights.
   * Only consumed by VrmRenderer — other renderers ignore it.
   */
  getMouthWeights?: () => MouthWeights
  /**
   * Called every animation frame to obtain current emotion state.
   * Only consumed by VrmRenderer — other renderers ignore it.
   */
  getEmotionState?: () => EmotionState
  /** When false, only the avatar mesh is hidden; scene / CSS background stays visible. */
  modelVisible?: boolean
  /** Full renderer settings (camera, lights, model transform, look-at mode). VRM only. */
  rendererSettings?: SceneRendererSettings
  baselineMood?: string
}

export default function AvatarRenderer({
  modelType,
  modelUrl,
  background = 'transparent',
  className,
  getMouthWeights,
  getEmotionState,
  modelVisible = true,
  rendererSettings,
  baselineMood,
}: AvatarRendererProps) {
  if (!modelUrl || modelType === 'none') {
    return <NoModel className={className} />
  }

  return (
    <div className={cn('relative w-full h-full overflow-hidden rounded-[inherit]', className)}>
      <Suspense fallback={<LoadingOverlay />}>
        {modelType === 'vrm' && (
          <VrmRenderer
            url={modelUrl}
            background={background}
            className="w-full h-full"
            getMouthWeights={getMouthWeights}
            getEmotionState={getEmotionState}
            modelVisible={modelVisible}
            rendererSettings={rendererSettings}
            baselineMood={baselineMood}
          />
        )}
        {modelType === 'glb' && (
          <GlbRenderer
            url={modelUrl}
            background={background}
            className="w-full h-full"
            modelVisible={modelVisible}
          />
        )}
        {modelType === 'live2d' && (
          <Live2dRenderer
            url={modelUrl}
            background={background}
            className="w-full h-full"
            modelVisible={modelVisible}
          />
        )}
      </Suspense>
    </div>
  )
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--surface-overlay)] backdrop-blur-[4px]">
      <div className="w-8 h-8 rounded-full border-2 border-[var(--border-default)] border-t-[var(--text-primary)] animate-spin" />
      <span className="text-[0.8rem] text-[var(--text-secondary)] tracking-[0.05em]">Loading model…</span>
    </div>
  )
}

function NoModel({ className }: { className?: string }) {
  return (
    <div className={cn(
      'relative w-full h-full overflow-hidden rounded-[inherit]',
      'flex flex-col items-center justify-center gap-2',
      'bg-[var(--surface-1)] border border-dashed border-[var(--border-default)] rounded-xl',
      className,
    )}>
      <span className="text-[2rem] opacity-20 leading-none">◈</span>
      <span className="text-[0.8rem] text-[var(--text-secondary)] tracking-[0.03em]">No model uploaded</span>
    </div>
  )
}
