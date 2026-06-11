'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { presignThumbnail, completeThumbnail } from '@/entities/soul/api/thumbnails'
import { queryKeys } from '@/shared/lib/query/keys'

export function useThumbnailCapture(cardId: string | undefined, modelId: string | null | undefined) {
  const queryClient = useQueryClient()
  const [isCapturing, setIsCapturing] = useState(false)
  const capturedRef = useRef(false)

  // Reset guard whenever the target model changes so each model gets its own capture.
  useEffect(() => { capturedRef.current = false }, [modelId])

  const capture = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!cardId || !modelId || capturedRef.current || isCapturing) return
    capturedRef.current = true
    setIsCapturing(true)

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : canvas.toBlob(
            b2 => (b2 ? resolve(b2) : reject(new Error('toBlob failed'))),
            'image/jpeg', 0.85
          )),
          'image/webp', 0.85,
        )
      })

      const { upload_url, public_url } = await presignThumbnail(cardId, modelId)

      await fetch(upload_url, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': blob.type },
      })

      await completeThumbnail(cardId, modelId, public_url)

      // Invalidate so project cards pick up the new thumbnail_url
      queryClient.invalidateQueries({ queryKey: queryKeys.souls.models(cardId) })
    } catch (err) {
      capturedRef.current = false
      console.warn('[thumbnail] capture failed:', err)
    } finally {
      setIsCapturing(false)
    }
  }, [cardId, modelId, isCapturing, queryClient])

  // Reset when model changes so next model gets its own capture
  const reset = useCallback(() => { capturedRef.current = false }, [])

  return { capture, isCapturing, reset }
}
