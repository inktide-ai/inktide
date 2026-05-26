'use client'
import { useCallback, useRef, useState } from 'react'
import type { AiCharacter } from '@/shared/lib/character/types'

/**
 * ISP: единственная ответственность — dirty-tracking и snapshot.
 * Не знает о API, выборе карточки или мутациях.
 */
export function useDirtyState() {
  const [isDirty, setIsDirty] = useState(false)
  const snapshotRef = useRef<AiCharacter | null>(null)

  const recordSnapshot = useCallback((char: AiCharacter) => {
    snapshotRef.current = char
    setIsDirty(false)
  }, [])

  const markDirty = useCallback(() => {
    setIsDirty(true)
  }, [])

  const clearDirty = useCallback(() => {
    setIsDirty(false)
  }, [])

  const getSnapshot = useCallback((): AiCharacter | null => {
    return snapshotRef.current
  }, [])

  return { isDirty, snapshotRef, recordSnapshot, markDirty, clearDirty, getSnapshot }
}
