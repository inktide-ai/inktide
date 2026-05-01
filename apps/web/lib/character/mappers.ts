import type { AiCardResponse, CreateAiCardRequest, UpdateAiCardRequest } from '@/api/soul'
import type { AiCharacter, Visibility, ModelType } from './types'
import { DEFAULTS } from './defaults'

/** SRP: только маппинг между API-DTO (snake_case) и доменными типами (camelCase). */

// ── Вспомогательные функции приведения типов ──────────────────────────────────

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' ? v : fallback
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

// ── Backend → Frontend ────────────────────────────────────────────────────────

export function apiResponseToCharacter(r: AiCardResponse): AiCharacter {
  const ap  = r.appearance ?? {}
  const llm = r.llm_config ?? {}
  const mem = r.memory_settings ?? {}
  const pilot = r.auto_pilot ?? {}
  const tts = r.tts_config ?? {}
  const rb  = r.response_behavior ?? {}

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    personality: r.personality,
    isActive: r.is_active,
    visibility: (r.visibility ?? 'private') as Visibility,
    systemPrompt: r.system_prompt,
    llmCatalogId: r.llm_catalog_id,

    appearance: {
      avatarUrl: r.avatar_url ?? null,
      bannerColorIndex: num(ap['banner_color_index'], 0),
      bannerCustomColor: (ap['banner_custom_color'] as string) ?? null,
      bannerImageUrl: (ap['banner_image_url'] as string) ?? null,
      activeSceneId: typeof ap['active_scene_id'] === 'string' ? ap['active_scene_id'] : null,
      modelType: str(ap['model_type'], 'none') as ModelType,
      modelFileName: (ap['model_file_name'] as string) ?? undefined,
      keyPhrases: str(ap['key_phrases'], ''),
    },

    llm: {
      providerId: (llm['provider_id'] as string) ?? null,
      modelId: (llm['model_id'] as string) ?? null,
      baseUrl: (llm['base_url'] as string) ?? null,
      temperature: num(llm['temperature'], DEFAULTS.temperature),
      maxTokens: num(llm['max_tokens'], DEFAULTS.maxTokens),
      topP: num(llm['top_p'], DEFAULTS.topP),
      frequencyPenalty: num(llm['frequency_penalty'], DEFAULTS.frequencyPenalty),
      presencePenalty: num(llm['presence_penalty'], DEFAULTS.presencePenalty),
    },

    tts: {
      providerId: (tts['provider_id'] as string) ?? null,
      voiceId: (tts['voice_id'] as string) ?? null,
      modelId: (tts['model_id'] as string) ?? null,
      apiKey: (tts['api_key'] as string) ?? null,
      baseUrl: (tts['base_url'] as string) ?? null,
      speed: num(tts['speed'], DEFAULTS.speed),
      stability: num(tts['stability'], DEFAULTS.stability),
      similarityBoost: num(tts['similarity_boost'], DEFAULTS.similarityBoost),
      style: num(tts['style'], DEFAULTS.style),
      useSpeakerBoost: bool(tts['use_speaker_boost'], DEFAULTS.useSpeakerBoost),
      pitch: num(tts['pitch'], DEFAULTS.pitch),
      volume: num(tts['volume'], DEFAULTS.volume),
    },

    behavior: {
      responseDelayMs: num(rb['response_delay_ms'], DEFAULTS.responseDelayMs),
      maxResponseLength: num(rb['max_response_length'], DEFAULTS.maxResponseLength),
      autoModerate: bool(rb['auto_moderate'], DEFAULTS.autoModerate),
      language: str(rb['language'], DEFAULTS.language),
      typingSimulation: bool(rb['typing_simulation'], DEFAULTS.typingSimulation),
      emotionIntensityScale: num(rb['emotion_intensity_scale'], DEFAULTS.emotionIntensityScale),
    },

    memory: {
      enabled: bool(mem['enabled'], DEFAULTS.memoryEnabled),
      maxMemories: num(mem['max_memories'], DEFAULTS.maxMemories),
      retentionDays: num(mem['retention_days'], DEFAULTS.retentionDays),
      importanceThreshold: num(mem['importance_threshold'], DEFAULTS.importanceThreshold),
    },

    autoPilot: {
      enabled: bool(pilot['enabled'], DEFAULTS.autoPilotEnabled),
      idleTimeoutSeconds: num(pilot['idle_timeout_seconds'], DEFAULTS.idleTimeoutSeconds),
      minIntervalSeconds: num(pilot['min_interval_seconds'], DEFAULTS.minIntervalSeconds),
      mood: str(pilot['mood'], DEFAULTS.mood),
    },

    channels: r.channels ?? [],
  }
}

// ── Frontend → Backend (полное обновление) ────────────────────────────────────

export function characterToUpdateRequest(c: AiCharacter): UpdateAiCardRequest {
  return {
    name: c.name,
    slug: c.slug,
    personality: c.personality,
    system_prompt: c.systemPrompt,
    avatar_url: c.appearance.avatarUrl ?? undefined,
    is_active: c.isActive,
    visibility: c.visibility,
    llm_config: {
      provider_id: c.llm.providerId,
      model_id: c.llm.modelId,
      base_url: c.llm.baseUrl,
      temperature: c.llm.temperature,
      max_tokens: c.llm.maxTokens,
      top_p: c.llm.topP,
      frequency_penalty: c.llm.frequencyPenalty,
      presence_penalty: c.llm.presencePenalty,
    },
    tts_config: {
      provider_id: c.tts.providerId,
      voice_id: c.tts.voiceId,
      model_id: c.tts.modelId,
      api_key: c.tts.apiKey,
      base_url: c.tts.baseUrl,
      speed: c.tts.speed,
      stability: c.tts.stability,
      similarity_boost: c.tts.similarityBoost,
      style: c.tts.style,
      use_speaker_boost: c.tts.useSpeakerBoost,
      pitch: c.tts.pitch,
      volume: c.tts.volume,
    },
    appearance: {
      banner_color_index: c.appearance.bannerColorIndex,
      banner_custom_color: c.appearance.bannerCustomColor ?? null,
      banner_image_url: c.appearance.bannerImageUrl ?? null,
      key_phrases: c.appearance.keyPhrases,
      model_type: c.appearance.modelType,
      model_file_name: c.appearance.modelFileName ?? null,
    },
    response_behavior: {
      response_delay_ms: c.behavior.responseDelayMs,
      max_response_length: c.behavior.maxResponseLength,
      auto_moderate: c.behavior.autoModerate,
      language: c.behavior.language,
      typing_simulation: c.behavior.typingSimulation,
      emotion_intensity_scale: c.behavior.emotionIntensityScale,
    },
    memory_settings: {
      enabled: c.memory.enabled,
      max_memories: c.memory.maxMemories,
      retention_days: c.memory.retentionDays,
      importance_threshold: c.memory.importanceThreshold,
    },
    auto_pilot: {
      enabled: c.autoPilot.enabled,
      idle_timeout_seconds: c.autoPilot.idleTimeoutSeconds,
      min_interval_seconds: c.autoPilot.minIntervalSeconds,
      mood: c.autoPilot.mood,
    },
  }
}

// ── Frontend → Backend (создание) ─────────────────────────────────────────────

export function characterToCreateRequest(
  c: Omit<AiCharacter, 'id'>,
  llmCatalogId: string,
): CreateAiCardRequest {
  return {
    name: c.name,
    personality: c.personality,
    system_prompt: c.systemPrompt,
    llm_catalog_id: llmCatalogId,
    llm_config: {
      provider_id: c.llm.providerId,
      model_id: c.llm.modelId,
      base_url: c.llm.baseUrl,
      temperature: c.llm.temperature,
      max_tokens: c.llm.maxTokens,
      top_p: c.llm.topP,
      frequency_penalty: c.llm.frequencyPenalty,
      presence_penalty: c.llm.presencePenalty,
    },
    tts_config: {
      provider_id: c.tts.providerId,
      voice_id: c.tts.voiceId,
      model_id: c.tts.modelId,
      api_key: c.tts.apiKey,
      base_url: c.tts.baseUrl,
      speed: c.tts.speed,
      stability: c.tts.stability,
      similarity_boost: c.tts.similarityBoost,
      style: c.tts.style,
      use_speaker_boost: c.tts.useSpeakerBoost,
      pitch: c.tts.pitch,
      volume: c.tts.volume,
    },
    appearance: {
      banner_color_index: c.appearance.bannerColorIndex,
      banner_custom_color: c.appearance.bannerCustomColor ?? null,
      banner_image_url: c.appearance.bannerImageUrl ?? null,
      key_phrases: c.appearance.keyPhrases,
      model_type: c.appearance.modelType,
      model_file_name: c.appearance.modelFileName ?? null,
    },
    response_behavior: {
      response_delay_ms: c.behavior.responseDelayMs,
      max_response_length: c.behavior.maxResponseLength,
      auto_moderate: c.behavior.autoModerate,
      language: c.behavior.language,
      typing_simulation: c.behavior.typingSimulation,
      emotion_intensity_scale: c.behavior.emotionIntensityScale,
    },
    memory_settings: {
      enabled: c.memory.enabled,
      max_memories: c.memory.maxMemories,
      retention_days: c.memory.retentionDays,
      importance_threshold: c.memory.importanceThreshold,
    },
    auto_pilot: {
      enabled: c.autoPilot.enabled,
      idle_timeout_seconds: c.autoPilot.idleTimeoutSeconds,
      min_interval_seconds: c.autoPilot.minIntervalSeconds,
      mood: c.autoPilot.mood,
    },
  }
}
