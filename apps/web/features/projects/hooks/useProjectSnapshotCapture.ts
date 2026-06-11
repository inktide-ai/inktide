'use client'
import { useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query/keys'
import { presignProjectPreview, completeProjectPreview } from '../api/preview'

interface Options {
  projectId: string | undefined
  sceneUrl: string | null
  captureImmediately: boolean
}

const workerSupported =
  typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'

function drawCover(ctx: OffscreenCanvasRenderingContext2D, img: ImageBitmap, dw: number, dh: number) {
  const srcAspect = img.width / img.height
  const dstAspect = dw / dh
  let sx: number, sy: number, sw: number, sh: number
  if (srcAspect > dstAspect) {
    sh = img.height; sw = sh * dstAspect; sx = (img.width - sw) / 2; sy = 0
  } else {
    sw = img.width; sh = sw / dstAspect; sx = 0; sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh)
}

async function compositeBitmapsToBlob(avatar: ImageBitmap, scene: ImageBitmap | null): Promise<Blob> {
  const MAX_DIM = 1280
  const scale = Math.min(1, MAX_DIM / Math.max(avatar.width, avatar.height))
  const w = Math.round(avatar.width * scale)
  const h = Math.round(avatar.height * scale)
  const out = new OffscreenCanvas(w, h)
  const ctx = out.getContext('2d')!
  if (scene) drawCover(ctx, scene, w, h)
  ctx.drawImage(avatar, 0, 0, w, h)
  return out.convertToBlob({ type: 'image/webp', quality: 0.85 })
}

function compositeViaWorkerBitmaps(
  worker: Worker,
  avatar: ImageBitmap,
  scene: ImageBitmap | null,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout'))
    }, 10_000)

    worker.onmessage = ({ data }: MessageEvent<{ blob?: Blob; error?: string }>) => {
      clearTimeout(timeout)
      if (data.error) reject(new Error(data.error))
      else resolve(data.blob!)
    }
    worker.onerror = (e) => {
      clearTimeout(timeout)
      reject(e)
    }

    // No transfer array — structured clone keeps bitmapRef.current alive in main thread.
    // The worker closes its copies in the finally block.
    worker.postMessage({ avatar, scene, width: avatar.width, height: avatar.height })
  })
}

export function useProjectSnapshotCapture({ projectId, sceneUrl, captureImmediately }: Options) {
  const queryClient           = useQueryClient()
  const canvasRef             = useRef<HTMLCanvasElement | null>(null)
  const bitmapRef             = useRef<ImageBitmap | null>(null)
  const lastUploadedBitmapRef = useRef<ImageBitmap | null>(null)
  const firstBitmapCapturedRef = useRef(false)
  const sceneImgRef           = useRef<HTMLImageElement | null>(null)
  const workerRef             = useRef<Worker | null>(null)

  useEffect(() => {
    if (!workerSupported) return
    workerRef.current = new Worker(
      new URL('../workers/composite.worker.ts', import.meta.url),
    )
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  // Pre-load scene image eagerly so it's ready when snapshot fires
  useEffect(() => {
    if (!sceneUrl) { sceneImgRef.current = null; return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => { sceneImgRef.current = img }
    img.onerror = () => { sceneImgRef.current = null }
    img.src = sceneUrl
  }, [sceneUrl])

  // Close stored bitmap on hook unmount to avoid memory leak
  useEffect(() => {
    return () => {
      bitmapRef.current?.close()
      bitmapRef.current = null
    }
  }, [])

  // Stable ref to the latest doSnapshot closure
  const doSnapshotRef = useRef(async () => {})
  doSnapshotRef.current = async () => {
    const bitmap = bitmapRef.current
    if (!bitmap || !projectId) return
    // Dedup: skip if this exact bitmap was already uploaded
    if (bitmap === lastUploadedBitmapRef.current) return
    lastUploadedBitmapRef.current = bitmap
    try {
      const sceneBitmap = sceneImgRef.current
        ? await createImageBitmap(sceneImgRef.current)
        : null
      const blob = workerRef.current
        ? await compositeViaWorkerBitmaps(workerRef.current, bitmap, sceneBitmap)
        : await compositeBitmapsToBlob(bitmap, sceneBitmap)
      sceneBitmap?.close()
      const { upload_url, public_url } = await presignProjectPreview(projectId)
      await fetch(upload_url, { method: 'PUT', body: blob, headers: { 'Content-Type': 'image/webp' } })
      await completeProjectPreview(projectId, public_url)
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
    } catch {
      lastUploadedBitmapRef.current = null // allow retry on next trigger
    }
  }

  // Main trigger: capture when leaving sandbox (Figma-style)
  useEffect(() => () => { void doSnapshotRef.current() }, [])

  // Secondary trigger: tab switch / browser minimize / Cmd+H
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') void doSnapshotRef.current()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  // Called by VrmRenderer.onFirstRender — every SNAPSHOT_INTERVAL_MS (30s) and immediately
  // on first render. Canvas is valid in this RAF frame — safe to createImageBitmap.
  // ImageBitmap is an independent heap object; survives VrmRenderer disposal.
  return useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas
    void createImageBitmap(canvas).then(bmp => {
      bitmapRef.current?.close()
      bitmapRef.current = bmp
      // captureImmediately: upload on first bitmap only (project has no existing preview)
      if (captureImmediately && !firstBitmapCapturedRef.current) {
        firstBitmapCapturedRef.current = true
        void doSnapshotRef.current()
      } else {
        firstBitmapCapturedRef.current = true
      }
    })
  }, [captureImmediately])
}
