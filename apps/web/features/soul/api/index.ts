import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'

// ── Response types (match backend snake_case JSON) ──

export interface AiCardListItem {
  id: string
  name: string
  slug: string
  avatar_url: string | null
  personality: string
  llm_model: string | null
  description: string
  status: 'active' | 'paused' | 'archived'
  cover_url: string | null
  platforms: string[]
  is_active: boolean
  updated_at: string
  sort_key: string
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
  has_custom_bot: boolean
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
  description: string
  status: 'active' | 'paused' | 'archived'
  cover_url: string | null
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
  personality_config: Record<string, unknown> | null
  visibility: string
  channels: ChannelResponse[] | null
  tools: ToolResponse[] | null
  category: string | null
  tags: string[]
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
  personality_config?: Record<string, unknown>
}

export interface UpdateAiCardRequest {
  name?: string
  slug?: string
  description?: string
  status?: 'active' | 'paused' | 'archived'
  cover_url?: string
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
  personality_config?: Record<string, unknown>
  is_active?: boolean
  visibility?: string
  category?: string | null
  tags?: string[]
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
export type ChannelPlatform = 'discord' | 'twitch' | 'kick' | 'vk_video' | 'telegram'

export interface CreateChannelLinkRequest {
  platform: ChannelPlatform
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
  is_active: boolean
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

export async function activateCardModel(cardId: string, modelId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/models/${modelId}/activate`, { method: 'PATCH' })
  if (!res.ok) throw new Error(`Failed to activate model: ${res.status}`)
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
  sort_key: string
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
  verifiedAt: string | null
  lastError: string | null
}

export interface CredentialTestResponse {
  success: boolean
  error: string | null
  testedAt: string
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

export async function testCredential(providerId: string): Promise<CredentialTestResponse> {
  const res = await apiFetch(`/api/soul/credentials/${encodeURIComponent(providerId)}/test`, {
    method: 'POST',
  })
  return jsonOrThrow<CredentialTestResponse>(res)
}

// ── Project export / import ───────────────────────────────────────────────────

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

export async function reorderScene(
  cardId: string,
  sceneId: string,
  body: { previous_id: string | null; next_id: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/scenes/${sceneId}/position`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return emptyOrThrow(res)
}

// ── Run presets (Scenes) ── runtime configuration overlay layer ──────────────

export interface RunPreset {
  id: string
  ai_card_id: string
  name: string
  description: string | null
  icon: string | null
  is_active: boolean
  override_llm_model_id: string | null
  override_temperature: number | null
  override_emotion_preset_id: string | null
  override_voice_profile_id: string | null
  created_at: string
  updated_at: string
}

export interface CreateRunPresetRequest {
  name: string
  description?: string | null
  icon?: string | null
  override_llm_model_id?: string | null
  override_temperature?: number | null
  override_emotion_preset_id?: string | null
  override_voice_profile_id?: string | null
}

export async function listRunPresets(cardId: string): Promise<RunPreset[]> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets`)
  return jsonOrThrow<RunPreset[]>(res)
}

export async function createRunPreset(cardId: string, body: CreateRunPresetRequest): Promise<RunPreset> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<RunPreset>(res)
}

export async function updateRunPreset(
  cardId: string,
  presetId: string,
  body: Partial<CreateRunPresetRequest> & { name: string },
): Promise<RunPreset> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/${presetId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<RunPreset>(res)
}

export async function deleteRunPreset(cardId: string, presetId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/${presetId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

export async function activateRunPreset(cardId: string, presetId: string): Promise<RunPreset> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/${presetId}/activate`, { method: 'POST' })
  return jsonOrThrow<RunPreset>(res)
}

export async function deactivateRunPreset(cardId: string): Promise<void> {
  const res = await apiFetch(`/api/soul/cards/${cardId}/run-presets/active`, { method: 'DELETE' })
  await emptyOrThrow(res)
}

// ── Discord OAuth2 ────────────────────────────────────────────────────────────

export interface DiscordTokenValidationResponse {
  valid: boolean
  error: string | null
}

export async function validateDiscordToken(
  botToken: string,
): Promise<DiscordTokenValidationResponse> {
  const res = await apiFetch('/api/connectors/discord/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken }),
  })
  return jsonOrThrow<DiscordTokenValidationResponse>(res)
}

export async function getDiscordInstallUrl(cardId: string): Promise<string> {
  const res = await apiFetch(`/api/connectors/discord/install-url?cardId=${cardId}`)
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function revokeDiscordChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/connectors/discord/revoke/${channelId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}

export async function reconnectDiscordChannel(channelId: string): Promise<string> {
  const res = await apiFetch(`/api/connectors/discord/reconnect/${channelId}`, { method: 'POST' })
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function saveDiscordCustomBot(channelId: string, botToken: string | null): Promise<void> {
  const res = await apiFetch(`/api/connectors/discord/channels/${channelId}/custom-bot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken }),
  })
  if (!res.ok) throw new Error(`Failed to save custom bot: ${res.status}`)
}

export async function createDiscordCustomBotChannel(cardId: string, botToken: string): Promise<void> {
  const channelRes = await createCardChannel(cardId, {
    platform: 'discord',
    channel_name: 'Custom Bot',
    bot_username: '',
    channel_id: '',
  })
  await saveDiscordCustomBot(channelRes.id, botToken)
}

// ── Telegram Bot Token ────────────────────────────────────────────────────────

export interface TelegramValidateResponse {
  valid: boolean
  username?: string
  error?: string
}

export async function validateTelegramBotToken(botToken: string): Promise<TelegramValidateResponse> {
  const res = await apiFetch('/api/connectors/telegram/validate-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botToken }),
  })
  return jsonOrThrow<TelegramValidateResponse>(res)
}

export async function createTelegramChannel(
  cardId: string,
  botToken: string,
  chatId: string,
  chatName: string,
): Promise<void> {
  const res = await apiFetch('/api/connectors/telegram/channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, botToken, chatId, chatName }),
  })
  if (!res.ok) throw new Error(`Failed to create Telegram channel: ${res.status}`)
}

export async function revokeTelegramChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/connectors/telegram/revoke/${channelId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}

// ── Public profile (unauthenticated) ─────────────────────────────────────────

export interface PublicAiCardResponse {
  id: string
  name: string
  slug: string
  description: string
  avatar_url: string | null
  cover_url: string | null
  personality: string
  status: string
  is_active: boolean
  platforms: string[]
  created_at: string
}

export async function getTwitchInstallUrl(cardId: string): Promise<string> {
  const res  = await apiFetch(`/api/connectors/twitch/install-url?cardId=${cardId}`)
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function revokeTwitchChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/connectors/twitch/revoke/${channelId}`, { method: 'POST' })
  if (!res.ok) throw new Error(`Revoke failed: ${res.status}`)
}

export async function reconnectTwitchChannel(channelId: string): Promise<string> {
  const res  = await apiFetch(`/api/connectors/twitch/reconnect/${channelId}`, { method: 'POST' })
  const data = await jsonOrThrow<{ url: string }>(res)
  return data.url
}

export async function getPublicCard(slug: string): Promise<PublicAiCardResponse> {
  const res = await fetch(`/api/soul/public/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`Soul not found: ${res.status}`)
  return res.json() as Promise<PublicAiCardResponse>
}
