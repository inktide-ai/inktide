import { apiFetch, jsonOrThrow } from '@/api/client'

interface PresignThumbnailResponse {
  upload_url: string
  public_url: string
}

export async function presignThumbnail(cardId: string, modelId: string): Promise<PresignThumbnailResponse> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/${modelId}/thumbnail/presign`, {
    method: 'POST',
  })
  return jsonOrThrow<PresignThumbnailResponse>(res)
}

export async function completeThumbnail(cardId: string, modelId: string, publicUrl: string): Promise<void> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/${modelId}/thumbnail/complete`, {
    method: 'POST',
    body: JSON.stringify({ public_url: publicUrl }),
  })
  if (!res.ok) throw new Error(`Failed to save thumbnail: ${res.status}`)
}
