import { z } from 'zod'

/**
 * Zod schemas for AiCard JSONB config fields.
 * These mirror the C# typed DTOs (AiCardLlmConfigDto, etc.) and prevent
 * silent nulls when the backend schema drifts or a field is renamed.
 *
 * All schemas use .default() so parse() never throws on missing fields —
 * falling back to sensible defaults instead of crashing the mapper.
 */

export const LlmConfigSchema = z.object({
  provider_id:       z.string().nullable().default(null),
  model_id:          z.string().nullable().default(null),
  base_url:          z.string().nullable().default(null),
  temperature:       z.number().default(0.7),
  max_tokens:        z.number().int().default(512),
  top_p:             z.number().default(1.0),
  frequency_penalty: z.number().default(0.0),
  presence_penalty:  z.number().default(0.0),
})

export const TtsConfigSchema = z.object({
  provider_id:      z.string().nullable().default(null),
  voice_id:         z.string().nullable().default(null),
  model_id:         z.string().nullable().default(null),
  api_key:          z.string().nullable().default(null),
  base_url:         z.string().nullable().default(null),
  speed:            z.number().default(1.0),
  stability:        z.number().default(0.5),
  similarity_boost: z.number().default(0.75),
  style:            z.number().default(0.0),
  use_speaker_boost: z.boolean().default(true),
  pitch:            z.number().default(1.0),
  volume:           z.number().default(1.0),
})

export const AppearanceSchema = z.object({
  banner_color_index:  z.number().int().default(0),
  banner_custom_color: z.string().nullable().default(null),
  banner_image_url:    z.string().nullable().default(null),
  model_type:          z.string().default('none'),
  model_file_name:     z.string().nullable().default(null),
  key_phrases:         z.array(z.string()).default([]),
  active_scene_id:     z.string().nullable().default(null),
})

export const BehaviorSchema = z.object({
  response_delay_ms:      z.number().int().default(0),
  max_response_length:    z.number().int().default(500),
  auto_moderate:          z.boolean().default(false),
  language:               z.string().default('en'),
  typing_simulation:      z.boolean().default(false),
  emotion_intensity_scale: z.number().default(1.0),
})

export const MemorySchema = z.object({
  enabled:              z.boolean().default(false),
  max_memories:         z.number().int().default(100),
  retention_days:       z.number().int().default(90),
  importance_threshold: z.number().default(0.5),
})

export const AutoPilotSchema = z.object({
  enabled:              z.boolean().default(false),
  idle_timeout_seconds: z.number().int().default(300),
  min_interval_seconds: z.number().int().default(60),
  mood:                 z.string().default('neutral'),
})

export const PersonalitySchema = z.object({
  warmth:                 z.number().default(0.7),
  playfulness:            z.number().default(0.5),
  assertiveness:          z.number().default(0.5),
  empathy:                z.number().default(0.7),
  formality:              z.number().default(0.3),
  sarcasm:                z.number().default(0.2),
  emotion_volatility:     z.number().default(0.5),
  emotion_responsiveness: z.number().default(0.7),
  emotion_memory:         z.number().default(0.5),
  stress_behavior:        z.string().default('deflect'),
  baseline_mood:          z.string().default('neutral'),
  preset_id:              z.string().nullable().default(null),
})

// Inferred types for use in the mapper
export type LlmConfig        = z.infer<typeof LlmConfigSchema>
export type TtsConfig        = z.infer<typeof TtsConfigSchema>
export type AppearanceConfig = z.infer<typeof AppearanceSchema>
export type BehaviorConfig   = z.infer<typeof BehaviorSchema>
export type MemoryConfig     = z.infer<typeof MemorySchema>
export type AutoPilotConfig  = z.infer<typeof AutoPilotSchema>
export type PersonalityConfig = z.infer<typeof PersonalitySchema>
