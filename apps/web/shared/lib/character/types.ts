import type { ChannelResponse } from '@/shared/types/soul-api'

export type ModelType = 'live2d' | 'vrm' | 'glb' | 'none'

export type Visibility = 'private' | 'unlisted' | 'public'

//
// Компоненты принимают только то, что используют:
//   BrainTab    → CharacterLlm
//   VoiceTab    → CharacterTts
//   BehaviorTab → CharacterBehavior
//   IdentityCard → CharacterIdentity + CharacterAppearance
//   MemoryTab   → CharacterMemory
//   AutoPilot   → CharacterAutoPilot

export type ProjectStatus = 'active' | 'paused' | 'archived'

export interface CharacterIdentity {
  id: string
  name: string
  slug: string
  description: string
  status: ProjectStatus
  coverUrl: string | null
  personality: string
  systemPrompt: string
  isActive: boolean
  visibility: Visibility
  llmCatalogId?: string
  createdAt: string
  category: string | null
  tags: string[]
}

export interface CharacterAppearance {
  avatarUrl: string | null
  bannerColorIndex: number
  bannerCustomColor: string | null
  bannerImageUrl: string | null
  modelType: ModelType
  modelFileName: string | null
  keyPhrases: string[]
  activeSceneId: string | null
}

export interface CharacterLlm {
  providerId: string | null
  modelId: string | null
  baseUrl: string | null
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
}

export interface CharacterTts {
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
  /** Pitch multiplier — stored for UI. */
  pitch: number
  /** Volume multiplier. */
  volume: number
}

export interface CharacterBehavior {
  responseDelayMs: number
  maxResponseLength: number
  autoModerate: boolean
  language: string
  typingSimulation: boolean
  emotionIntensityScale: number
}

export interface CharacterPersonality {
  warmth: number
  playfulness: number
  assertiveness: number
  empathy: number
  formality: number
  sarcasm: number
  emotionVolatility: number
  emotionResponsiveness: number
  emotionMemory: number
  stressBehavior: string
  baselineMood: string
  presetId: string | null
}

export interface CharacterMemory {
  enabled: boolean
  maxMemories: number
  retentionDays: number
  importanceThreshold: number
}

export interface CharacterAutoPilot {
  enabled: boolean
  idleTimeoutSeconds: number
  minIntervalSeconds: number
  mood: string
}

/**
 * Полный агрегат — для backward compat с существующими компонентами.
 * Новые компоненты должны принимать конкретный суб-интерфейс.
 */
export interface AiCharacter extends CharacterIdentity {
  appearance: CharacterAppearance
  llm: CharacterLlm
  tts: CharacterTts
  behavior: CharacterBehavior
  memory: CharacterMemory
  autoPilot: CharacterAutoPilot
  /** Structured personality traits and emotional dynamics (distinct from free-text `personality` description). */
  personalityConfig: CharacterPersonality
  /** Flat list of channel links — managed via Channel tab, not via updateCard. */
  channels: ChannelResponse[]
}
