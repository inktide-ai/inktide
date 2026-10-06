import { apiFetch, jsonOrThrow } from '@/api/client'
import type {
  BeginModelUploadResponse,
  AiCardModelResponse,
} from '@/shared/types/soul-api'
import type { ChunkedUploadSession } from '@/shared/types/IChunkedUploader'

export async function presignCardModelUpload(
  cardId: string,
  body: { file_name: string; content_type: string; size_bytes: number },
): Promise<BeginModelUploadResponse> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/presign`, {
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
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/complete`, {
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
// OCP: паттерн presign->PUT->complete написан один раз, не дублируется здесь

// Resumable upload: the file goes through the API in small chunks (see ChunkedUploadService.ts).

export async function startCardModelChunkedUpload(
  cardId: string,
  body: { file_name: string; size_bytes: number },
): Promise<ChunkedUploadSession> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/uploads`, {
    method: 'POST',
    body: JSON.stringify({ file_name: body.file_name, size_bytes: body.size_bytes }),
  })
  return jsonOrThrow<ChunkedUploadSession>(res)
}

export async function getCardModelChunkedUpload(
  cardId: string,
  uploadId: string,
): Promise<ChunkedUploadSession | null> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/uploads/${uploadId}`)
  if (res.status === 404) return null
  return jsonOrThrow<ChunkedUploadSession>(res)
}

export async function putCardModelChunk(
  cardId: string,
  uploadId: string,
  offset: number,
  chunk: Blob,
): Promise<number> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/uploads/${uploadId}?offset=${offset}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: chunk,
  })
  // 409: an earlier attempt got partly through and the server holds a different amount - continue from there.
  if (res.status === 409) {
    const body = await res.clone().json().catch(() => null) as { received_bytes?: unknown } | null
    if (typeof body?.received_bytes === 'number') return body.received_bytes
  }
  return (await jsonOrThrow<{ received_bytes: number }>(res)).received_bytes
}

export async function completeCardModelChunkedUpload(
  cardId: string,
  uploadId: string,
): Promise<AiCardModelResponse> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/uploads/${uploadId}/complete`, { method: 'POST' })
  return jsonOrThrow<AiCardModelResponse>(res)
}

export async function listCardModels(cardId: string): Promise<AiCardModelResponse[]> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models`)
  return jsonOrThrow<AiCardModelResponse[]>(res)
}

export async function activateCardModel(cardId: string, modelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/${modelId}`, {
    method: 'PATCH',
    body: JSON.stringify({ active: true }),
  })
  if (!res.ok) throw new Error(`Failed to activate model: ${res.status}`)
}

export async function deleteCardModel(cardId: string, modelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/souls/cards/${cardId}/models/${modelId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete model: ${res.status}`)
}
