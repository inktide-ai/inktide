import { apiFetch, jsonOrThrow } from '@/api/client'
import type {
  BeginModelUploadResponse,
  AiCardModelResponse,
} from '@/shared/types/soul-api'

export async function presignCardModelUpload(
  cardId: string,
  body: { file_name: string; content_type: string; size_bytes: number },
): Promise<BeginModelUploadResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/models/presign`, {
    method: 'POST',
    body: JSON.stringify({
      file_name: body.file_name,
      content_type: body.content_type,
      size_bytes: body.size_bytes,
    }),
  })
  return jsonOrThrow<BeginModelUploadResponse>(res)
}

export async function completeCardModelUpload(
  cardId: string,
  body: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
  },
): Promise<AiCardModelResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/models/complete`, {
    method: 'POST',
    body: JSON.stringify({
      storage_key: body.storage_key,
      file_name: body.file_name,
      content_type: body.content_type,
      size_bytes: body.size_bytes,
    }),
  })
  return jsonOrThrow<AiCardModelResponse>(res)
}

// uploadCardModelFile перенесён в services/upload/CardModelUploader.ts + PresignedUploadService.ts
// OCP: паттерн presign→PUT→complete написан один раз, не дублируется здесь

export async function listCardModels(cardId: string): Promise<AiCardModelResponse[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/models`)
  return jsonOrThrow<AiCardModelResponse[]>(res)
}

export async function activateCardModel(cardId: string, modelId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/models/${modelId}/activate`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Failed to activate model: ${res.status}`)
}
