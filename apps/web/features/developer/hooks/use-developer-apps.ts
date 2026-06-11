import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query/keys'
import {
  getMyApps, getApp, createApp, updateApp, deleteApp,
  rotateSecret, getDeliveries, testWebhook,
  type CreateApplicationRequest, type UpdateApplicationRequest,
} from '../api/developer'

export function useMyApps() {
  return useQuery({
    queryKey: queryKeys.developer.apps(),
    queryFn: getMyApps,
  })
}

export function useApp(id: string) {
  return useQuery({
    queryKey: queryKeys.developer.app(id),
    queryFn: () => getApp(id),
    enabled: !!id,
  })
}

export function useCreateApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateApplicationRequest) => createApp(req),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.developer.apps() }) },
    onError: (err) => { console.error('[useCreateApp]', err) },
  })
}

export function useUpdateApp(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: UpdateApplicationRequest) => updateApp(id, req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.developer.app(id) })
      qc.invalidateQueries({ queryKey: queryKeys.developer.apps() })
    },
    onError: (err) => { console.error('[useUpdateApp]', err) },
  })
}

export function useDeleteApp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteApp(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.developer.apps() }) },
    onError: (err) => { console.error('[useDeleteApp]', err) },
  })
}

export function useRotateSecret(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => rotateSecret(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.developer.app(id) }) },
    onError: (err) => { console.error('[useRotateSecret]', err) },
  })
}

export function useDeliveries(appId: string) {
  return useQuery({
    queryKey: queryKeys.developer.deliveries(appId),
    queryFn: () => getDeliveries(appId),
    enabled: !!appId,
  })
}

export function useTestWebhook(appId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => testWebhook(appId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.developer.deliveries(appId) }) },
    onError: (err) => { console.error('[useTestWebhook]', err) },
  })
}
