'use client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query/keys'

// Centralised mutation hook for channel operations.
// Assumes fire-and-invalidate semantics — TResult defaults to void.
// If a mutation needs its return value, use useMutation directly.
export function useChannelMutation<TArgs, TResult = void>(
  soulId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.souls.channels(soulId) }),
  })
}
