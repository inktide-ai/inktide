import { apiFetch, jsonOrThrow } from './client'

export interface StorageUsageResponse {
  usedBytes: number
  maxBytes: number
  usedGb: number
  maxGb: number
}

export async function fetchStorageUsage(): Promise<StorageUsageResponse> {
  const res = await apiFetch('/api/v1/storage/usage')
  return jsonOrThrow<StorageUsageResponse>(res)
}
