'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import type { EmotionState } from '@/shared/types/IVrmController'

/** Matches the SignalR emotion auto-clear timeout in useAudioStream.ts */
export const EMOTION_OVERRIDE_DURATION_MS = 5_000

export function useEmotionOverride(getAutoEmotion: () => EmotionState) {
  const overrideRef = useRef<EmotionState | null>(null)
  const clearTimer  = useRef<ReturnType<typeof setTimeout>>()
  const [activeEmotion, setActiveEmotion] = useState<string | null>(null)

  const triggerEmotion = useCallback((emotion: string) => {
    if (overrideRef.current?.emotion === emotion) {
      clearTimeout(clearTimer.current)
      overrideRef.current = null
      setActiveEmotion(null)
      return
    }
    clearTimeout(clearTimer.current)
    overrideRef.current = { emotion, intensity: 0.85 }
    setActiveEmotion(emotion)
    clearTimer.current = setTimeout(() => {
      overrideRef.current = null
      setActiveEmotion(null)
    }, EMOTION_OVERRIDE_DURATION_MS)
  }, [])

  const clearEmotion = useCallback(() => {
    clearTimeout(clearTimer.current)
    overrideRef.current = null
    setActiveEmotion(null)
  }, [])

  const getEmotionState = useCallback(
    (): EmotionState => overrideRef.current ?? getAutoEmotion(),
    [getAutoEmotion],
  )

  useEffect(() => () => { clearTimeout(clearTimer.current) }, [])

  return { activeEmotion, triggerEmotion, clearEmotion, getEmotionState }
}
