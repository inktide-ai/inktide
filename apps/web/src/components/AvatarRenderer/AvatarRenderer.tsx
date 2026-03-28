import { lazy, Suspense } from 'react'
import type { ModelType } from '../ProfilePage/types'
import styles from './AvatarRenderer.module.css'

// Lazy-load heavy renderers — three.js is ~600KB, don't load until needed
const VrmRenderer = lazy(() => import('./renderers/VrmRenderer'))
const GlbRenderer = lazy(() => import('./renderers/GlbRenderer'))
const Live2dRenderer = lazy(() => import('./renderers/Live2dRenderer'))

export interface AvatarRendererProps {
  modelType: ModelType
  modelUrl: string | null
  /** 'transparent' for future RTMP overlay, hex/named color for studio preview */
  background?: string
  className?: string
}

export default function AvatarRenderer({ modelType, modelUrl, background = 'transparent', className }: AvatarRendererProps) {
  if (!modelUrl || modelType === 'none') {
    return <NoModel className={className} />
  }

  return (
    <div className={`${styles.root} ${className ?? ''}`}>
      <Suspense fallback={<LoadingOverlay />}>
        {modelType === 'vrm' && (
          <VrmRenderer url={modelUrl} background={background} className={styles.fill} />
        )}
        {modelType === 'glb' && (
          <GlbRenderer url={modelUrl} background={background} className={styles.fill} />
        )}
        {modelType === 'live2d' && (
          <Live2dRenderer url={modelUrl} background={background} className={styles.fill} />
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
