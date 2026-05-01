import { lazy, Suspense } from 'react'
import type { ModelType } from '@/lib/character'
import type { MouthWeights } from '../../hooks/useLipSync'
import type { LookAtMode } from './renderers/VrmRenderer'
import type { SceneRendererSettings } from '../../hooks/useSceneRendererSettings'
import type { EmotionState } from '@/types/IVrmController'
import styles from './AvatarRenderer.module.css'

// Lazy-load heavy renderers — three.js is ~600KB, don't load until needed
const VrmRenderer   = lazy(() => import('./renderers/VrmRenderer'))
const GlbRenderer   = lazy(() => import('./renderers/GlbRenderer'))
const Live2dRenderer = lazy(() => import('./renderers/Live2dRenderer'))

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
}: AvatarRendererProps) {
  if (!modelUrl || modelType === 'none') {
    return <NoModel className={className} />
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <Suspense fallback={<LoadingOverlay />}>
        {modelType === 'vrm' && (
          <VrmRenderer
            url={modelUrl}
            background={background}
            className={styles.fill}
            getMouthWeights={getMouthWeights}
            getEmotionState={getEmotionState}
            modelVisible={modelVisible}
            rendererSettings={rendererSettings}
          />
        )}
        {modelType === 'glb' && (
          <GlbRenderer
            url={modelUrl}
            background={background}
            className={styles.fill}
            modelVisible={modelVisible}
          />
        )}
        {modelType === 'live2d' && (
          <Live2dRenderer
            url={modelUrl}
            background={background}
            className={styles.fill}
            modelVisible={modelVisible}
          />
        )}
      </Suspense>
    </div>
  )
}

function LoadingOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.spinner} />
      <span className={styles.overlayText}>Loading model…</span>
    </div>
  )
}

function NoModel({ className }: { className?: string }) {
  return (
    <div className={`${styles.root} ${styles.empty} ${className ?? ''}`}>
      <span className={styles.emptyIcon}>◈</span>
      <span className={styles.emptyText}>No model uploaded</span>
    </div>
  )
}
