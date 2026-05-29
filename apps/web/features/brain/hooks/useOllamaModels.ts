'use client'
import { useQuery } from '@tanstack/react-query'
import { getChatModels, type ChatModelInfo } from '@/features/brain/api/chat'
import { useDebounce } from '@/shared/hooks'

export interface UseOllamaModelsResult {
  models: ChatModelInfo[]
  modelsLoading: boolean
  modelsError: boolean
}

export function useOllamaModels(
  effectiveBaseUrl: string,
  credLoading: boolean,
): UseOllamaModelsResult {
  const debouncedUrl = useDebounce(effectiveBaseUrl, 500)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ollama-models', debouncedUrl],
    queryFn: () => getChatModels('ollama', debouncedUrl),
    enabled: !credLoading && Boolean(debouncedUrl),
    staleTime: 30_000,
    retry: 1,
  })

  return {
    models: data ?? [],
    modelsLoading: isLoading,
    modelsError: isError,
  }
}
