import { apiFetch, emptyOrThrow, jsonOrThrow } from './client'

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

// uploadCardModelFile перенесён в services/upload/CardModelUploader.ts + PresignedUploadService.ts
// OCP: паттерн presign→PUT→complete написан один раз, не дублируется здесь

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
  /** Explicit filter tag; omit or null → client uses legacy hash category. */
  tag?: string | null
  /** Optional display title; when empty client falls back to file name. */
  display_name?: string | null
  description?: string | null
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
  body: {
    storage_key: string
    file_name: string
    content_type: string
    size_bytes: number
    tag?: string | null
  },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

export interface CustomSceneTagDto {
  label: string
  color: string | null
}

export async function listCustomSceneTags(cardId: string): Promise<CustomSceneTagDto[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/custom-tags`)
  return jsonOrThrow<CustomSceneTagDto[]>(res)
}

export async function addCustomSceneTag(cardId: string, label: string, color?: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/custom-tags`, {
    method: 'POST',
    body: JSON.stringify({ label, color: color ?? null }),
  })
  await emptyOrThrow(res)
}

export async function patchCardSceneTag(
  cardId: string,
  sceneId: string,
  body: { tag: string | null },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

export async function putCardSceneMetadata(
  cardId: string,
  sceneId: string,
  body: {
    display_name?: string | null
    description?: string | null
    tag?: string | null
  },
): Promise<AiCardSceneResponse> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}/metadata`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<AiCardSceneResponse>(res)
}

// uploadCardSceneFile перенесён в services/upload/CardSceneUploader.ts + PresignedUploadService.ts
// OCP: паттерн presign→PUT→complete написан один раз, не дублируется здесь

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

// ── Provider credentials (BYOK) ──

export interface CredentialResponse {
  providerId: string
  hasKey: boolean
  baseUrl: string | null
  config: string | null
  updatedAt: string
}

export async function getCredentials(): Promise<CredentialResponse[]> {
  const res = await apiFetch('/api/soul/credentials')
  return jsonOrThrow<CredentialResponse[]>(res)
}

export async function upsertCredential(
  providerId: string,
  apiKey: string | null,
  baseUrl?: string | null,
  config?: Record<string, unknown> | null,
): Promise<CredentialResponse> {
  const res = await apiFetch(`/api/soul/credentials/${encodeURIComponent(providerId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey:  apiKey ?? null,
      baseUrl: baseUrl ?? null,
      config:  config ? JSON.stringify(config) : null,
    }),
  })
  return jsonOrThrow<CredentialResponse>(res)
}

export async function deleteCredential(providerId: string): Promise<void> {
  await apiFetch(`/api/soul/credentials/${encodeURIComponent(providerId)}`, { method: 'DELETE' })
}
