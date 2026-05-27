'use client'
import { useEffect, useState } from 'react'
import { getChatModels, type ChatModelInfo } from '@/api/chat'

export interface UseOllamaModelsResult {
  models: ChatModelInfo[]
  modelsLoading: boolean
  modelsError: boolean
}

/**
 * Fetches the list of locally available Ollama models.
 * Waits until credentials have finished loading (`credLoading = false`) before making
 * the first request. Re-fetches whenever `effectiveBaseUrl` changes (debounced 500ms).
 */
export function useOllamaModels(
  effectiveBaseUrl: string,
  credLoading: boolean,
): UseOllamaModelsResult {
  const [models, setModels]               = useState<ChatModelInfo[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError]     = useState(false)

  useEffect(() => {
    if (credLoading) return
    let cancelled = false
    setModelsError(false)
    const timer = setTimeout(() => {
      setModelsLoading(true)
      getChatModels('ollama', effectiveBaseUrl)
        .then((list) => { if (!cancelled) { setModels(list); setModelsError(false) } })
        .catch(() => { if (!cancelled) { setModels([]); setModelsError(true) } })
        .finally(() => { if (!cancelled) setModelsLoading(false) })
    }, 500)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [effectiveBaseUrl, credLoading])

  return { models, modelsLoading, modelsError }
}
