// Shared UI primitives, hooks, utilities, and API functions — safe for any layer to import.
export * from './api'
export * from './components'
export { useCardChannelId, useChannelMutation, useFavorites, useVoiceProvider } from './hooks'
export { statusFromCard, accentFromCard, toSoulCardData, splitPersonalityForSoulCard } from './lib'

// channels, emotion, scenes, voice are page-level compositions.
// Import them via specific subpaths, not from this barrel:
//   @/features/soul/channels
//   @/features/soul/emotion
//   @/features/soul/scenes
//   @/features/soul/voice
