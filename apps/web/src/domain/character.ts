/**
 * Barrel re-export для backward compatibility.
 * Новый код должен импортировать напрямую из:
 *   domain/character/types.ts
 *   domain/character/defaults.ts
 *   domain/character/mappers.ts
 */
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
} from './character/types'

export { DEFAULTS, createDefaultCharacter } from './character/defaults'

export {
  apiResponseToCharacter,
  characterToUpdateRequest,
  characterToCreateRequest,
} from './character/mappers'
