import type { AiCardResponse, ChannelResponse, CreateAiCardRequest, UpdateAiCardRequest } from '../api/soul'

export type ModelType = 'live2d' | 'vrm' | 'glb' | 'none'

export type Visibility = 'private' | 'unlisted' | 'public'

export interface AiCharacter {
  id: string
  name: string
  slug: string
  personality: string
  systemPrompt: string
  isActive: boolean
  visibility: Visibility
  llmCatalogId?: string

  appearance: {
    avatarUrl?: string | null
    bannerColorIndex: number
    modelType: ModelType
    modelFileName?: string
    keyPhrases: string
  }

  llm: {
    providerId: string | null
    modelId: string | null
    baseUrl: string | null
    temperature: number
    maxTokens: number
    topP: number
    frequencyPenalty: number
    presencePenalty: number
  }

  tts: {
    providerId: string | null
    voiceId: string | null
    modelId: string | null
    apiKey: string | null
    baseUrl: string | null
    speed: number
    stability: number
    similarityBoost: number
    /** Style exaggeration 0–1 (ElevenLabs). */
    style: number
    /** Speaker boost toggle (ElevenLabs). */
    useSpeakerBoost: boolean
    /** Pitch multiplier — stored for UI, limited provider support. */
    pitch: number
    /** Volume multiplier — passed to providers that support it (e.g. Kokoro volume_multiplier). */
    volume: number
  }

  behavior: {
    responseDelayMs: number
    maxResponseLength: number
    autoModerate: boolean
    language: string
    typingSimulation: boolean
  }

  memory: {
    enabled: boolean
    maxMemories: number
    retentionDays: number
    importanceThreshold: number
  }

  autoPilot: {
    enabled: boolean
    idleTimeoutSeconds: number
    minIntervalSeconds: number
    mood: string
  }

  /** Flat list of channel links from the API — managed via the Integration tab, not via updateCard. */
  channels: ChannelResponse[]
}

export const DEFAULTS = {
  systemPrompt:
    'You are a friendly AI companion on a live stream. You interact with chat, react to events, and entertain viewers. Keep responses concise and engaging.',
  responseDelayMs: 1500,
  maxResponseLength: 400,
  autoModerate: true,
  language: 'en',
  typingSimulation: true,
  temperature: 0.7,
  maxTokens: 512,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0,
  memoryEnabled: true,
  maxMemories: 100,
  retentionDays: 30,
  importanceThreshold: 0.5,
  autoPilotEnabled: false,
  idleTimeoutSeconds: 120,
  minIntervalSeconds: 60,
  mood: 'neutral',
  llmProviderId: null as string | null,
  llmModelId: null as string | null,
  llmBaseUrl: null as string | null,
  ttsProviderId: null as string | null,
  ttsVoiceId: null as string | null,
  speed: 1.0,
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.0,
  useSpeakerBoost: true,
  pitch: 1.0,
  volume: 1.0,
} as const

export const createDefaultCharacter = (): Omit<AiCharacter, 'id'> => ({
  name: '',
  slug: '',
  personality: '',
  isActive: false,
  visibility: 'private',
  systemPrompt: DEFAULTS.systemPrompt,
  appearance: {
    avatarUrl: null,
    bannerColorIndex: 0,
    modelType: 'none',
    modelFileName: undefined,
    keyPhrases: '',
  },
  llm: {
    providerId: DEFAULTS.llmProviderId,
    modelId: DEFAULTS.llmModelId,
    baseUrl: DEFAULTS.llmBaseUrl,
    temperature: DEFAULTS.temperature,
    maxTokens: DEFAULTS.maxTokens,
    topP: DEFAULTS.topP,
    frequencyPenalty: DEFAULTS.frequencyPenalty,
    presencePenalty: DEFAULTS.presencePenalty,
  },
  tts: {
    providerId: DEFAULTS.ttsProviderId,
    voiceId: DEFAULTS.ttsVoiceId,
    modelId: null,
    apiKey: null,
    baseUrl: null,
    speed: DEFAULTS.speed,
    stability: DEFAULTS.stability,
    similarityBoost: DEFAULTS.similarityBoost,
    style: DEFAULTS.style,
    useSpeakerBoost: DEFAULTS.useSpeakerBoost,
    pitch: DEFAULTS.pitch,
    volume: DEFAULTS.volume,
  },
  behavior: {
    responseDelayMs: DEFAULTS.responseDelayMs,
    maxResponseLength: DEFAULTS.maxResponseLength,
    autoModerate: DEFAULTS.autoModerate,
    language: DEFAULTS.language,
    typingSimulation: DEFAULTS.typingSimulation,
  },
  memory: {
    enabled: DEFAULTS.memoryEnabled,
    maxMemories: DEFAULTS.maxMemories,
    retentionDays: DEFAULTS.retentionDays,
    importanceThreshold: DEFAULTS.importanceThreshold,
  },
  autoPilot: {
    enabled: DEFAULTS.autoPilotEnabled,
    idleTimeoutSeconds: DEFAULTS.idleTimeoutSeconds,
    minIntervalSeconds: DEFAULTS.minIntervalSeconds,
    mood: DEFAULTS.mood,
  },
  channels: [],
})

// ── Backend → Frontend ──

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' ? v : fallback
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

export function apiResponseToCharacter(r: AiCardResponse): AiCharacter {
  const ap = r.appearance ?? {}
  const llm = r.llm_config ?? {}
  const mem = r.memory_settings ?? {}
  const pilot = r.auto_pilot ?? {}
  const tts = r.tts_config ?? {}
  const rb = r.response_behavior ?? {}

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

// ── Frontend → Backend (full update) ──

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

// ── Frontend → Backend (create) ──

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
