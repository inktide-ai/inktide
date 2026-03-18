export type ModelType = 'live2d' | 'vrm' | 'glb' | 'none'

export interface AiCharacter {
  id: string
  name: string
  slug: string
  bannerColorIndex?: number
  personality: string
  keyPhrases: string
  modelType: ModelType
  modelFileName?: string
  isActive: boolean
  systemPrompt: string
  // Behavior
  responseDelayMs: number
  maxResponseLength: number
  autoModerate: boolean
  language: string
  typingSimulation: boolean
  // LLM
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  // Memory
  memoryEnabled: boolean
  maxMemories: number
  retentionDays: number
  importanceThreshold: number
  // Donkey
  donkeyEnabled: boolean
  idleTimeoutSeconds: number
  minIntervalSeconds: number
  mood: string
  // Voice
  ttsEnabled: boolean
  useCustomVoice: boolean
  selectedVoiceId: string | null
  customVoiceFile: string | null
  speed: number
  pitch: number
  stability: number
  similarityBoost: number
}

export const createDefaultCharacter = (): Omit<AiCharacter, 'id'> => ({
  name: '',
  slug: '',
  bannerColorIndex: 0,
  personality: '',
  keyPhrases: '',
  modelType: 'none',
  isActive: false,
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
  customVoiceFile: null,
  speed: 1.0,
  pitch: 1.0,
  stability: 0.5,
  similarityBoost: 0.75,
})
