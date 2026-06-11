import { z } from 'zod'
import type { AiCardResponse, CreateAiCardRequest, UpdateAiCardRequest } from '@/shared/types/soul-api'
import type { AiCharacter } from './types'
import {
  LlmConfigSchema,
  TtsConfigSchema,
  AppearanceSchema,
  BehaviorSchema,
  MemorySchema,
  AutoPilotSchema,
  PersonalitySchema,
} from './schemas'

const ProjectStatusSchema = z.enum(['active', 'paused', 'archived'])
const VisibilitySchema    = z.enum(['private', 'unlisted', 'public'])
const ModelTypeSchema     = z.enum(['vrm', 'glb', 'live2d', 'none'])

/** SRP: только маппинг между API-DTO (snake_case) и доменными типами (camelCase). */


export function apiResponseToCharacter(r: AiCardResponse): AiCharacter {
  // Zod schemas parse with defaults — safe against schema drift and missing fields
  const llm     = LlmConfigSchema.parse(r.llm_config ?? {})
  const tts     = TtsConfigSchema.parse(r.tts_config ?? {})
  const ap      = AppearanceSchema.parse(r.appearance ?? {})
  const rb      = BehaviorSchema.parse(r.response_behavior ?? {})
  const mem     = MemorySchema.parse(r.memory_settings ?? {})
  const pilot   = AutoPilotSchema.parse(r.auto_pilot ?? {})
  const pers    = PersonalitySchema.parse(r.personality_config ?? {})

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    status: ProjectStatusSchema.parse(r.status ?? 'active'),
    coverUrl: r.cover_url ?? null,
    personality: r.personality,
    isActive: r.is_active,
    visibility: VisibilitySchema.parse(r.visibility ?? 'private'),
    systemPrompt: r.system_prompt,
    llmCatalogId: r.llm_catalog_id,
    createdAt: r.created_at,
    category: r.category ?? null,
    tags: r.tags ?? [],

    appearance: {
      avatarUrl: r.avatar_url ?? null,
      bannerColorIndex:  ap.banner_color_index,
      bannerCustomColor: ap.banner_custom_color,
      bannerImageUrl:    ap.banner_image_url,
      activeSceneId:     ap.active_scene_id,
      modelType:         ModelTypeSchema.parse(ap.model_type),
      modelFileName:     ap.model_file_name ?? null,
      keyPhrases:        ap.key_phrases,
    },

    llm: {
      providerId:       llm.provider_id,
      modelId:          llm.model_id,
      baseUrl:          llm.base_url,
      temperature:      llm.temperature,
      maxTokens:        llm.max_tokens,
      topP:             llm.top_p,
      frequencyPenalty: llm.frequency_penalty,
      presencePenalty:  llm.presence_penalty,
    },

    tts: {
      providerId:      tts.provider_id,
      voiceId:         tts.voice_id,
      modelId:         tts.model_id,
      apiKey:          tts.api_key,
      baseUrl:         tts.base_url,
      speed:           tts.speed,
      stability:       tts.stability,
      similarityBoost: tts.similarity_boost,
      style:           tts.style,
      useSpeakerBoost: tts.use_speaker_boost,
      pitch:           tts.pitch,
      volume:          tts.volume,
    },

    behavior: {
      responseDelayMs:       rb.response_delay_ms,
      maxResponseLength:     rb.max_response_length,
      autoModerate:          rb.auto_moderate,
      language:              rb.language,
      typingSimulation:      rb.typing_simulation,
      emotionIntensityScale: rb.emotion_intensity_scale,
    },

    memory: {
      enabled:             mem.enabled,
      maxMemories:         mem.max_memories,
      retentionDays:       mem.retention_days,
      importanceThreshold: mem.importance_threshold,
    },

    autoPilot: {
      enabled:             pilot.enabled,
      idleTimeoutSeconds:  pilot.idle_timeout_seconds,
      minIntervalSeconds:  pilot.min_interval_seconds,
      mood:                pilot.mood,
    },

    personalityConfig: {
      warmth:                pers.warmth,
      playfulness:           pers.playfulness,
      assertiveness:         pers.assertiveness,
      empathy:               pers.empathy,
      formality:             pers.formality,
      sarcasm:               pers.sarcasm,
      emotionVolatility:     pers.emotion_volatility,
      emotionResponsiveness: pers.emotion_responsiveness,
      emotionMemory:         pers.emotion_memory,
      stressBehavior:        pers.stress_behavior,
      baselineMood:          pers.baseline_mood,
      presetId:              pers.preset_id,
    },

    channels: r.channels ?? [],
  }
}


export function characterToUpdateRequest(c: AiCharacter): UpdateAiCardRequest {
  return {
    name:          c.name,
    slug:          c.slug,
    description:   c.description,
    status:        c.status,
    cover_url:     c.coverUrl ?? undefined,
    personality:   c.personality,
    system_prompt: c.systemPrompt,
    avatar_url:    c.appearance.avatarUrl ?? undefined,
    is_active:     c.isActive,
    visibility:    c.visibility,
    category:      c.category ?? null,
    tags:          c.tags,
    llm_config: {
      provider_id:       c.llm.providerId,
      model_id:          c.llm.modelId,
      base_url:          c.llm.baseUrl,
      temperature:       c.llm.temperature,
      max_tokens:        c.llm.maxTokens,
      top_p:             c.llm.topP,
      frequency_penalty: c.llm.frequencyPenalty,
      presence_penalty:  c.llm.presencePenalty,
    },
    tts_config: {
      provider_id:      c.tts.providerId,
      voice_id:         c.tts.voiceId,
      model_id:         c.tts.modelId,
      api_key:          c.tts.apiKey,
      base_url:         c.tts.baseUrl,
      speed:            c.tts.speed,
      stability:        c.tts.stability,
      similarity_boost: c.tts.similarityBoost,
      style:            c.tts.style,
      use_speaker_boost: c.tts.useSpeakerBoost,
      pitch:            c.tts.pitch,
      volume:           c.tts.volume,
    },
    appearance: {
      banner_color_index:  c.appearance.bannerColorIndex,
      banner_custom_color: c.appearance.bannerCustomColor ?? null,
      banner_image_url:    c.appearance.bannerImageUrl ?? null,
      key_phrases:         c.appearance.keyPhrases,
      model_type:          c.appearance.modelType,
      model_file_name:     c.appearance.modelFileName ?? null,
    },
    response_behavior: {
      response_delay_ms:       c.behavior.responseDelayMs,
      max_response_length:     c.behavior.maxResponseLength,
      auto_moderate:           c.behavior.autoModerate,
      language:                c.behavior.language,
      typing_simulation:       c.behavior.typingSimulation,
      emotion_intensity_scale: c.behavior.emotionIntensityScale,
    },
    memory_settings: {
      enabled:              c.memory.enabled,
      max_memories:         c.memory.maxMemories,
      retention_days:       c.memory.retentionDays,
      importance_threshold: c.memory.importanceThreshold,
    },
    auto_pilot: {
      enabled:              c.autoPilot.enabled,
      idle_timeout_seconds: c.autoPilot.idleTimeoutSeconds,
      min_interval_seconds: c.autoPilot.minIntervalSeconds,
      mood:                 c.autoPilot.mood,
    },
    personality_config: {
      warmth:                 c.personalityConfig.warmth,
      playfulness:            c.personalityConfig.playfulness,
      assertiveness:          c.personalityConfig.assertiveness,
      empathy:                c.personalityConfig.empathy,
      formality:              c.personalityConfig.formality,
      sarcasm:                c.personalityConfig.sarcasm,
      emotion_volatility:     c.personalityConfig.emotionVolatility,
      emotion_responsiveness: c.personalityConfig.emotionResponsiveness,
      emotion_memory:         c.personalityConfig.emotionMemory,
      stress_behavior:        c.personalityConfig.stressBehavior,
      baseline_mood:          c.personalityConfig.baselineMood,
      preset_id:              c.personalityConfig.presetId,
    },
  }
}


export function characterToCreateRequest(
  c: Omit<AiCharacter, 'id'>,
  llmCatalogId: string,
): CreateAiCardRequest {
  return {
    name:          c.name,
    personality:   c.personality,
    system_prompt: c.systemPrompt,
    llm_catalog_id: llmCatalogId,
    llm_config: {
      provider_id:       c.llm.providerId,
      model_id:          c.llm.modelId,
      base_url:          c.llm.baseUrl,
      temperature:       c.llm.temperature,
      max_tokens:        c.llm.maxTokens,
      top_p:             c.llm.topP,
      frequency_penalty: c.llm.frequencyPenalty,
      presence_penalty:  c.llm.presencePenalty,
    },
    tts_config: {
      provider_id:      c.tts.providerId,
      voice_id:         c.tts.voiceId,
      model_id:         c.tts.modelId,
      api_key:          c.tts.apiKey,
      base_url:         c.tts.baseUrl,
      speed:            c.tts.speed,
      stability:        c.tts.stability,
      similarity_boost: c.tts.similarityBoost,
      style:            c.tts.style,
      use_speaker_boost: c.tts.useSpeakerBoost,
      pitch:            c.tts.pitch,
      volume:           c.tts.volume,
    },
    appearance: {
      banner_color_index:  c.appearance.bannerColorIndex,
      banner_custom_color: c.appearance.bannerCustomColor ?? null,
      banner_image_url:    c.appearance.bannerImageUrl ?? null,
      key_phrases:         c.appearance.keyPhrases,
      model_type:          c.appearance.modelType,
      model_file_name:     c.appearance.modelFileName ?? null,
    },
    response_behavior: {
      response_delay_ms:       c.behavior.responseDelayMs,
      max_response_length:     c.behavior.maxResponseLength,
      auto_moderate:           c.behavior.autoModerate,
      language:                c.behavior.language,
      typing_simulation:       c.behavior.typingSimulation,
      emotion_intensity_scale: c.behavior.emotionIntensityScale,
    },
    memory_settings: {
      enabled:              c.memory.enabled,
      max_memories:         c.memory.maxMemories,
      retention_days:       c.memory.retentionDays,
      importance_threshold: c.memory.importanceThreshold,
    },
    auto_pilot: {
      enabled:              c.autoPilot.enabled,
      idle_timeout_seconds: c.autoPilot.idleTimeoutSeconds,
      min_interval_seconds: c.autoPilot.minIntervalSeconds,
      mood:                 c.autoPilot.mood,
    },
    personality_config: {
      warmth:                 c.personalityConfig.warmth,
      playfulness:            c.personalityConfig.playfulness,
      assertiveness:          c.personalityConfig.assertiveness,
      empathy:                c.personalityConfig.empathy,
      formality:              c.personalityConfig.formality,
      sarcasm:                c.personalityConfig.sarcasm,
      emotion_volatility:     c.personalityConfig.emotionVolatility,
      emotion_responsiveness: c.personalityConfig.emotionResponsiveness,
      emotion_memory:         c.personalityConfig.emotionMemory,
      stress_behavior:        c.personalityConfig.stressBehavior,
      baseline_mood:          c.personalityConfig.baselineMood,
      preset_id:              c.personalityConfig.presetId,
    },
  }
}

// These were previously used to manually extract nested JSONB values.
// They're no longer needed in the mapper but kept so call sites don't break.
export const _deprecated = {
  num: (v: unknown, fallback: number): number =>
    typeof v === 'number' ? v : fallback,
  bool: (v: unknown, fallback: boolean): boolean =>
    typeof v === 'boolean' ? v : fallback,
  str: (v: unknown, fallback: string): string =>
    typeof v === 'string' ? v : fallback,
} as const
