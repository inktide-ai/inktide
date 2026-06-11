// Domain DTOs shared across features/, entities/, and shared/ layers.
// HTTP call functions live in features/soul/api/index.ts.


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


export type ChannelPlatform = 'discord' | 'twitch' | 'kick' | 'vk_video' | 'telegram'

export interface CreateChannelLinkRequest {
  platform: ChannelPlatform
  channel_name: string
  /** Routing key: guild id (Discord), channel/login/id string for Twitch/Kick/VK Video. */
  channel_id: string
  bot_username: string
}


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
  thumbnail_url?: string | null
}


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

export interface CustomSceneTagDto {
  label: string
  color: string | null
}


export interface AiCardActivityItem {
  id: string
  action: string
  created_at: string
}


export interface AiCardStats {
  messages_24h: number
  llm_calls_24h: number
  tts_chars_24h: number
  memory_count: number
}


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


export interface DiscordTokenValidationResponse {
  valid: boolean
  error: string | null
}

export interface TelegramValidateResponse {
  valid: boolean
  username?: string
  error?: string
}


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
