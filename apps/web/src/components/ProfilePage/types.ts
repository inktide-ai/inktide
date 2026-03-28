import type { AiCardResponse, CreateAiCardRequest, UpdateAiCardRequest } from '../../api/soul'

export type ModelType = 'live2d' | 'vrm' | 'glb' | 'none'

export interface AiCharacter {
  id: string
  name: string
  slug: string
  avatarUrl?: string | null
  bannerColorIndex?: number
  personality: string
  keyPhrases: string
  modelType: ModelType
  modelFileName?: string
  isActive: boolean
  systemPrompt: string
  llmCatalogId?: string
  ttsCatalogId?: string | null
  responseDelayMs: number
  maxResponseLength: number
  autoModerate: boolean
  language: string
  typingSimulation: boolean
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  memoryEnabled: boolean
  maxMemories: number
  retentionDays: number
  importanceThreshold: number
  donkeyEnabled: boolean
  idleTimeoutSeconds: number
  minIntervalSeconds: number
  mood: string
  ttsEnabled: boolean
  useCustomVoice: boolean
  selectedVoiceId: string | null
  customVoiceFile: string | null
  speed: number
  pitch: number
  stability: number
  similarityBoost: number
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
  donkeyEnabled: false,
  idleTimeoutSeconds: 120,
  minIntervalSeconds: 60,
  mood: 'neutral',
  ttsEnabled: true,
  useCustomVoice: false,
  selectedVoiceId: '1',
  speed: 1.0,
  pitch: 1.0,
  stability: 0.5,
  similarityBoost: 0.75,
} as const

export const createDefaultCharacter = (): Omit<AiCharacter, 'id'> => ({
  name: '',
  slug: '',
  avatarUrl: null,
  bannerColorIndex: 0,
  personality: '',
  keyPhrases: '',
  modelType: 'none',
  isActive: false,
  systemPrompt: DEFAULTS.systemPrompt,
  responseDelayMs: DEFAULTS.responseDelayMs,
  maxResponseLength: DEFAULTS.maxResponseLength,
  autoModerate: DEFAULTS.autoModerate,
  language: DEFAULTS.language,
  typingSimulation: DEFAULTS.typingSimulation,
  temperature: DEFAULTS.temperature,
  maxTokens: DEFAULTS.maxTokens,
  topP: DEFAULTS.topP,
  frequencyPenalty: DEFAULTS.frequencyPenalty,
  presencePenalty: DEFAULTS.presencePenalty,
  memoryEnabled: DEFAULTS.memoryEnabled,
  maxMemories: DEFAULTS.maxMemories,
  retentionDays: DEFAULTS.retentionDays,
  importanceThreshold: DEFAULTS.importanceThreshold,
  donkeyEnabled: DEFAULTS.donkeyEnabled,
  idleTimeoutSeconds: DEFAULTS.idleTimeoutSeconds,
  minIntervalSeconds: DEFAULTS.minIntervalSeconds,
  mood: DEFAULTS.mood,
  ttsEnabled: DEFAULTS.ttsEnabled,
  useCustomVoice: DEFAULTS.useCustomVoice,
  selectedVoiceId: DEFAULTS.selectedVoiceId,
  customVoiceFile: null,
  speed: DEFAULTS.speed,
  pitch: DEFAULTS.pitch,
  stability: DEFAULTS.stability,
  similarityBoost: DEFAULTS.similarityBoost,
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
  const b = r.behavior ?? {}
  const llm = r.llm_config ?? {}
  const mem = r.memory_settings ?? {}
  const dk = r.donkey_engine ?? {}
  const tts = r.tts_config ?? {}

  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    avatarUrl: r.avatar_url ?? null,
    personality: r.personality,
    isActive: r.is_active,
    systemPrompt: r.system_prompt,
    llmCatalogId: r.llm_catalog_id,
    ttsCatalogId: r.tts_catalog_id,

    bannerColorIndex: num(b['banner_color_index'], 0),
    keyPhrases: str(b['key_phrases'], ''),
    modelType: str(b['model_type'], 'none') as ModelType,
    modelFileName: (b['model_file_name'] as string) ?? undefined,
    responseDelayMs: num(b['response_delay_ms'], DEFAULTS.responseDelayMs),
    maxResponseLength: num(b['max_response_length'], DEFAULTS.maxResponseLength),
    autoModerate: bool(b['auto_moderate'], DEFAULTS.autoModerate),
    language: str(b['language'], DEFAULTS.language),
    typingSimulation: bool(b['typing_simulation'], DEFAULTS.typingSimulation),

    temperature: num(llm['temperature'], DEFAULTS.temperature),
    maxTokens: num(llm['max_tokens'], DEFAULTS.maxTokens),
    topP: num(llm['top_p'], DEFAULTS.topP),
    frequencyPenalty: num(llm['frequency_penalty'], DEFAULTS.frequencyPenalty),
    presencePenalty: num(llm['presence_penalty'], DEFAULTS.presencePenalty),

    memoryEnabled: bool(mem['enabled'], DEFAULTS.memoryEnabled),
    maxMemories: num(mem['max_memories'], DEFAULTS.maxMemories),
    retentionDays: num(mem['retention_days'], DEFAULTS.retentionDays),
    importanceThreshold: num(mem['importance_threshold'], DEFAULTS.importanceThreshold),

    donkeyEnabled: bool(dk['enabled'], DEFAULTS.donkeyEnabled),
    idleTimeoutSeconds: num(dk['idle_timeout_seconds'], DEFAULTS.idleTimeoutSeconds),
    minIntervalSeconds: num(dk['min_interval_seconds'], DEFAULTS.minIntervalSeconds),
    mood: str(dk['mood'], DEFAULTS.mood),

    ttsEnabled: bool(tts['enabled'], DEFAULTS.ttsEnabled),
    useCustomVoice: bool(tts['use_custom_voice'], DEFAULTS.useCustomVoice),
    selectedVoiceId: (tts['selected_voice_id'] as string) ?? null,
    customVoiceFile: (tts['custom_voice_file'] as string) ?? null,
    speed: num(tts['speed'], DEFAULTS.speed),
    pitch: num(tts['pitch'], DEFAULTS.pitch),
    stability: num(tts['stability'], DEFAULTS.stability),
    similarityBoost: num(tts['similarity_boost'], DEFAULTS.similarityBoost),
  }
}

// ── Frontend → Backend (full update) ──

export function characterToUpdateRequest(c: AiCharacter): UpdateAiCardRequest {
  return {
    name: c.name,
    slug: c.slug,
    personality: c.personality,
    system_prompt: c.systemPrompt,
    avatar_url: c.avatarUrl ?? undefined,
    is_active: c.isActive,
    llm_config: {
      temperature: c.temperature,
      max_tokens: c.maxTokens,
      top_p: c.topP,
      frequency_penalty: c.frequencyPenalty,
      presence_penalty: c.presencePenalty,
    },
    tts_config: {
      enabled: c.ttsEnabled,
      use_custom_voice: c.useCustomVoice,
      selected_voice_id: c.selectedVoiceId,
      custom_voice_file: c.customVoiceFile,
      speed: c.speed,
      pitch: c.pitch,
      stability: c.stability,
      similarity_boost: c.similarityBoost,
    },
    behavior: {
      banner_color_index: c.bannerColorIndex ?? 0,
      key_phrases: c.keyPhrases,
      model_type: c.modelType,
      model_file_name: c.modelFileName ?? null,
      response_delay_ms: c.responseDelayMs,
      max_response_length: c.maxResponseLength,
      auto_moderate: c.autoModerate,
      language: c.language,
      typing_simulation: c.typingSimulation,
    },
    memory_settings: {
      enabled: c.memoryEnabled,
      max_memories: c.maxMemories,
      retention_days: c.retentionDays,
      importance_threshold: c.importanceThreshold,
    },
    donkey_engine: {
      enabled: c.donkeyEnabled,
      idle_timeout_seconds: c.idleTimeoutSeconds,
      min_interval_seconds: c.minIntervalSeconds,
      mood: c.mood,
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
    tts_catalog_id: c.ttsCatalogId ?? undefined,
    llm_config: {
      temperature: c.temperature,
      max_tokens: c.maxTokens,
      top_p: c.topP,
      frequency_penalty: c.frequencyPenalty,
      presence_penalty: c.presencePenalty,
    },
    tts_config: {
      enabled: c.ttsEnabled,
      use_custom_voice: c.useCustomVoice,
      selected_voice_id: c.selectedVoiceId,
      custom_voice_file: c.customVoiceFile,
      speed: c.speed,
      pitch: c.pitch,
      stability: c.stability,
      similarity_boost: c.similarityBoost,
    },
    behavior: {
      banner_color_index: c.bannerColorIndex ?? 0,
      key_phrases: c.keyPhrases,
      model_type: c.modelType,
      model_file_name: c.modelFileName ?? null,
      response_delay_ms: c.responseDelayMs,
      max_response_length: c.maxResponseLength,
      auto_moderate: c.autoModerate,
      language: c.language,
      typing_simulation: c.typingSimulation,
    },
    memory_settings: {
      enabled: c.memoryEnabled,
      max_memories: c.maxMemories,
      retention_days: c.retentionDays,
      importance_threshold: c.importanceThreshold,
    },
    donkey_engine: {
      enabled: c.donkeyEnabled,
      idle_timeout_seconds: c.idleTimeoutSeconds,
      min_interval_seconds: c.minIntervalSeconds,
      mood: c.mood,
    },
  }
}
