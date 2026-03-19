import { apiFetch, jsonOrThrow } from './client'

export interface MeResponse {
  userId: string
  userName: string
  role: string
  pictureUrl?: string | null
}

export interface DeleteMeResponse {
  databasePurged: boolean
  identityRemovedFromKeycloak: boolean
  keycloakAdminSkipped: boolean
  warning?: string | null
}

export async function getMe(): Promise<MeResponse> {
  const res = await apiFetch('/api/me')
  return jsonOrThrow<MeResponse>(res)
}

export interface StorageStatusResponse {
  enabled: boolean
  bucket: string | null
}

export async function getStorageStatus(): Promise<StorageStatusResponse> {
  const res = await apiFetch('/api/storage/status')
  return jsonOrThrow<StorageStatusResponse>(res)
}

export interface UploadStorageResponse {
  key: string
  size: number
}

export async function uploadProfileFile(file: File): Promise<UploadStorageResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await apiFetch('/api/storage/upload', { method: 'POST', body })
  return jsonOrThrow<UploadStorageResponse>(res)
}

export interface PatchAvatarResponse {
  pictureUrl: string | null
}

/** Sets Keycloak user attribute `picture` to the public URL of a file already uploaded to storage. */
export async function patchAvatar(objectKey: string): Promise<PatchAvatarResponse> {
  const res = await apiFetch('/api/me/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ objectKey }),
  })
  return jsonOrThrow<PatchAvatarResponse>(res)
}

/** Purges Soul DB data for the current user; removes Keycloak user when Admin API is configured. */
export async function deleteAccount(): Promise<DeleteMeResponse> {
  const res = await apiFetch('/api/me', { method: 'DELETE' })
  return jsonOrThrow<DeleteMeResponse>(res)
}
