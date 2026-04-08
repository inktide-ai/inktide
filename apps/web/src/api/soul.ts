import { ApiError, apiFetch, emptyOrThrow, jsonOrThrow } from './client'

// ── Response types (match backend snake_case JSON) ──

export interface AiCardListItem {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  personality: string
  llm_model: string | null
  is_active: boolean
  updated_at: string
}

export interface LlmModelResponse {
  id: string
  provider: string
  model_id: string
  display_name: string
  tier: string
}

export interface TtsVoiceResponse {
  id: string
  provider: string
  voice_id: string
  display_name: string
  language: string
  gender: string | null
  sample_url: string | null
  tier: string
}

export interface ChannelResponse {
  id: string
  platform: string
  channel_name: string
  /** Discord: guild id — must match connector ingest (Synapse routing). */
  channel_id: string | null
  bot_username: string
  is_active: boolean
  connected_at: string | null
}

export interface ToolResponse {
  id: string
  tool_name: string
  tool_config: unknown
  is_enabled: boolean
}

export interface AiCardResponse {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  personality: string
  system_prompt: string
  llm_catalog_id: string
  llm_config: Record<string, unknown> | null
  llm_model: LlmModelResponse | null
  tts_catalog_id: string | null
  tts_config: Record<string, unknown> | null
  tts_voice: TtsVoiceResponse | null
  appearance: Record<string, unknown> | null
  response_behavior: Record<string, unknown> | null
  memory_settings: Record<string, unknown> | null
  auto_pilot: Record<string, unknown> | null
  visibility: string
  channels: ChannelResponse[] | null
  tools: ToolResponse[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Request types ──

export interface CreateAiCardRequest {
  name: string
  personality?: string
  system_prompt: string
  avatar_url?: string
  llm_catalog_id: string
  llm_config?: Record<string, unknown>
  tts_config?: Record<string, unknown>
  appearance?: Record<string, unknown>
  response_behavior?: Record<string, unknown>
  memory_settings?: Record<string, unknown>
  auto_pilot?: Record<string, unknown>
}

export interface UpdateAiCardRequest {
  name?: string
  slug?: string
  personality?: string
  system_prompt?: string
  avatar_url?: string
  llm_catalog_id?: string
  llm_config?: Record<string, unknown>
  tts_config?: Record<string, unknown>
  appearance?: Record<string, unknown>
  response_behavior?: Record<string, unknown>
  memory_settings?: Record<string, unknown>
  auto_pilot?: Record<string, unknown>
  is_active?: boolean
  visibility?: string
}

// ── API functions ──

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

/** Must match Soul ingest / Synapse routing (`ai_card_channels.platform` + `channel_id`). */
export type IntegrationPlatform = 'discord' | 'twitch' | 'kick' | 'vk_video'

export interface CreateChannelLinkRequest {
  platform: IntegrationPlatform
  channel_name: string
  /** Routing key: guild id (Discord), channel/login/id string for Twitch/Kick/VK Video — same as connector ChatMessage.ChannelId. */
  channel_id: string
  bot_username: string
}

export async function createCardChannel(
  cardId: string,
  body: CreateChannelLinkRequest,
): Promise<ChannelResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/channels`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<ChannelResponse>(res)
}

export async function patchCardChannel(
  cardId: string,
  linkId: string,
  body: { is_active: boolean },
): Promise<ChannelResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/channels/${linkId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active: body.is_active }),
  })
  return jsonOrThrow<ChannelResponse>(res)
}

export async function deleteCardChannel(cardId: string, linkId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/channels/${linkId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

/** POST multipart file; stores under users/{userId}/cards/{cardId}/ and sets avatar_url on the card. */
export async function uploadCardAvatar(cardId: string, file: File): Promise<AiCardResponse> {
  const body = new FormData()
  body.append('file', file)
  const res = await apiFetch(`/api/soul/cards/${cardId}/avatar`, { method: 'POST', body })
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

// ── 3D/2D model assets (MinIO presigned PUT → PostgreSQL) ──

export interface BeginModelUploadResponse {
  upload_url: string
  storage_key: string
  expires_at: string
  required_content_type: string
}

export interface AiCardModelResponse {
  id: string
  ai_card_id: string
  storage_key: string
  public_url: string
  original_file_name: string
  content_type: string
  size_bytes: number
  created_at: string
}

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

/** Presign → PUT to MinIO (no API auth on that request) → complete registration. */
export async function uploadCardModelFile(cardId: string, file: File): Promise<AiCardModelResponse> {
  const contentType = file.type.trim() || 'application/octet-stream'
  const presign = await presignCardModelUpload(cardId, {
    file_name: file.name,
    content_type: contentType,
    size_bytes: file.size,
  })
  const putRes = await fetch(presign.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': presign.required_content_type },
    body: file,
  })
  if (!putRes.ok) {
    throw new ApiError(putRes.status, `Storage upload failed (${putRes.status})`)
  }
  return completeCardModelUpload(cardId, {
    storage_key: presign.storage_key,
    file_name: file.name,
    content_type: presign.required_content_type,
    size_bytes: file.size,
  })
}

export async function listCardModels(cardId: string): Promise<AiCardModelResponse[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/models`)
  return jsonOrThrow<AiCardModelResponse[]>(res)
}

// ── Scene (background image) assets (MinIO presigned PUT → PostgreSQL) ──

export interface AiCardSceneResponse {
  id: string
  ai_card_id: string
  storage_key: string
  public_url: string
  original_file_name: string
  content_type: string
  size_bytes: number
  created_at: string
}

export async function listCardScenes(cardId: string): Promise<AiCardSceneResponse[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes`)
  return jsonOrThrow<AiCardSceneResponse[]>(res)
}

export async function presignSceneUpload(
  cardId: string,
  body: { file_name: string; content_type: string; size_bytes: number },
): Promise<BeginModelUploadResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/presign`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<BeginModelUploadResponse>(res)
}

export async function completeSceneUpload(
  cardId: string,
  body: { storage_key: string; file_name: string; content_type: string; size_bytes: number },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

/** Presign → PUT to MinIO → complete registration. Replaces any existing scene. */
export async function uploadCardSceneFile(cardId: string, file: File): Promise<AiCardSceneResponse> {
  const contentType = file.type.trim() || 'image/jpeg'
  const presign = await presignSceneUpload(cardId, {
    file_name: file.name,
    content_type: contentType,
    size_bytes: file.size,
  })
  const putRes = await fetch(presign.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': presign.required_content_type },
    body: file,
  })
  if (!putRes.ok) {
    throw new ApiError(putRes.status, `Storage upload failed (${putRes.status})`)
  }
  return completeSceneUpload(cardId, {
    storage_key: presign.storage_key,
    file_name: file.name,
    content_type: presign.required_content_type,
    size_bytes: file.size,
  })
}

export async function deleteCardScene(cardId: string, sceneId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

// ── Activity log ──

export interface AiCardActivityItem {
  id: string
  action: string
  created_at: string
}

export async function getCardActivity(cardId: string): Promise<AiCardActivityItem[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/activity`)
  return jsonOrThrow<AiCardActivityItem[]>(res)
}
