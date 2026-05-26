export type {
  ModelType,
  Visibility,
  AiCharacter,
  CharacterIdentity,
  CharacterAppearance,
  CharacterLlm,
  CharacterTts,
  CharacterBehavior,
  CharacterMemory,
  CharacterAutoPilot,
  CharacterPersonality,
} from '@/shared/lib/character/types'

export { DEFAULTS, createDefaultCharacter } from '@/shared/lib/character/defaults'

export {
  apiResponseToCharacter,
  characterToUpdateRequest,
  characterToCreateRequest,
} from '@/shared/lib/character/mappers'
