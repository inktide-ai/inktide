import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'
import type {
  AiCardListItem,
  AiCardResponse,
  LlmModelResponse,
  TtsVoiceResponse,
  CreateAiCardRequest,
  UpdateAiCardRequest,
  AiCardActivityItem,
  PublicAiCardResponse,
} from '@/shared/types/soul-api'

export async function getCards(): Promise<AiCardListItem[]> {
  const res = await apiFetch('/api/soul/cards')
  return jsonOrThrow<AiCardListItem[]>(res)
}

export async function getCard(id: string): Promise<AiCardResponse> {
  const res = await apiFetch(`/api/soul/cards/${id}`)
  return jsonOrThrow<AiCardResponse>(res)
}

export async function createCard(data: CreateAiCardRequest): Promise<AiCardResponse> {
  const res = await apiFetch('/api/soul/cards', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<AiCardResponse>(res)
}

export async function updateCard(id: string, data: UpdateAiCardRequest): Promise<AiCardResponse> {
  const res = await apiFetch(`/api/soul/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<AiCardResponse>(res)
}

export async function deleteCard(id: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${id}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

/** POST multipart file; stores under users/{userId}/cards/{cardId}/ and sets avatar_url on the card. */
export async function uploadCardAvatar(cardId: string, file: File): Promise<AiCardResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await apiFetch(`/api/soul/cards/${cardId}/avatar`, { method: 'POST', body })
  return jsonOrThrow<AiCardResponse>(res)
}

/** POST multipart image; sets banner_image_url inside appearance JSONB. */
export async function uploadCardBanner(cardId: string, file: File): Promise<AiCardResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await apiFetch(`/api/soul/cards/${cardId}/banner`, { method: 'POST', body })
  return jsonOrThrow<AiCardResponse>(res)
}

/** DELETE banner image; reverts card to colour gradient. */
export async function removeCardBanner(cardId: string): Promise<AiCardResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/banner`, { method: 'DELETE' })
  return jsonOrThrow<AiCardResponse>(res)
}

export async function getCatalogLlmModels(): Promise<LlmModelResponse[]> {
  const res = await apiFetch('/api/soul/catalog/llm-models')
  return jsonOrThrow<LlmModelResponse[]>(res)
}

export async function getCatalogTtsVoices(): Promise<TtsVoiceResponse[]> {
  const res = await apiFetch('/api/soul/catalog/tts-voices')
  return jsonOrThrow<TtsVoiceResponse[]>(res)
}

export async function getCardActivity(cardId: string): Promise<AiCardActivityItem[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/activity`)
  return jsonOrThrow<AiCardActivityItem[]>(res)
}

export async function exportProject(cardId: string): Promise<Blob> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/export`)
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  return res.blob()
}

export async function importProject(data: object): Promise<{ character_id: string }> {
  const res = await apiFetch('/api/projects/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return jsonOrThrow<{ character_id: string }>(res)
}

export async function reorderCard(
  cardId: string,
  body: { previous_id: string | null; next_id: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/position`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return emptyOrThrow(res)
}

export async function getPublicCard(slug: string): Promise<PublicAiCardResponse> {
  const res = await fetch(`/api/soul/public/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`Soul not found: ${res.status}`)
  return res.json() as Promise<PublicAiCardResponse>
}
