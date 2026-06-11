import { apiFetch, jsonOrThrow } from '@/api/client'

interface PresignPreviewResponse {
  upload_url: string
  public_url: string
}

export async function presignProjectPreview(projectId: string): Promise<PresignPreviewResponse> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/preview/presign`, { method: 'POST' })
  return jsonOrThrow<PresignPreviewResponse>(res)
}

export async function completeProjectPreview(projectId: string, publicUrl: string): Promise<void> {
  await apiFetch(`/api/v1/projects/${projectId}/preview/complete`, {
    method: 'POST',
    body: JSON.stringify({ public_url: publicUrl }),
  })
}
