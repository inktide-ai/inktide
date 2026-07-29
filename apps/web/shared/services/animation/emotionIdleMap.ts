export interface IdleVariation {
  clipId: string
  /** 0-1 chance to trigger at end of each idle cycle. */
  probability: number
  crossFadeDuration: number
}

export interface IdleProfile {
  variations: IdleVariation[]
}

export const EMOTION_IDLE_PROFILES: Record<string, IdleProfile> = {
  neutral: { variations: [
    { clipId: 'breathing_idle', probability: 0.20, crossFadeDuration: 0.4 },
    { clipId: 'thinking',       probability: 0.08, crossFadeDuration: 0.3 },
    { clipId: 'relax',          probability: 0.06, crossFadeDuration: 0.3 },
  ]},
  calm: { variations: [
    { clipId: 'breathing_idle', probability: 0.35, crossFadeDuration: 0.5 },
    { clipId: 'relax',          probability: 0.20, crossFadeDuration: 0.3 },
  ]},
  happy: { variations: [
    { clipId: 'blush',          probability: 0.15, crossFadeDuration: 0.3 },
    { clipId: 'relax',          probability: 0.12, crossFadeDuration: 0.3 },
    { clipId: 'breathing_idle', probability: 0.10, crossFadeDuration: 0.4 },
  ]},
  sad: { variations: [
    { clipId: 'sad',            probability: 0.18, crossFadeDuration: 0.4 },
    { clipId: 'thinking',       probability: 0.12, crossFadeDuration: 0.3 },
    { clipId: 'breathing_idle', probability: 0.08, crossFadeDuration: 0.5 },
  ]},
  sleepy: { variations: [
    { clipId: 'sleepy',         probability: 0.30, crossFadeDuration: 0.5 },
    { clipId: 'breathing_idle', probability: 0.15, crossFadeDuration: 0.6 },
  ]},
  thinking: { variations: [
    { clipId: 'thinking',       probability: 0.30, crossFadeDuration: 0.3 },
    { clipId: 'relax',          probability: 0.08, crossFadeDuration: 0.3 },
  ]},
  angry: { variations: [
    { clipId: 'angry',          probability: 0.12, crossFadeDuration: 0.3 },
    { clipId: 'thinking',       probability: 0.10, crossFadeDuration: 0.3 },
  ]},
  shy: { variations: [
    { clipId: 'blush',          probability: 0.25, crossFadeDuration: 0.3 },
    { clipId: 'breathing_idle', probability: 0.12, crossFadeDuration: 0.4 },
  ]},
  confident: { variations: [
    { clipId: 'relax',          probability: 0.18, crossFadeDuration: 0.3 },
    { clipId: 'breathing_idle', probability: 0.08, crossFadeDuration: 0.4 },
  ]},
  excited: { variations: [
    { clipId: 'happy',     probability: 0.20, crossFadeDuration: 0.25 },
    { clipId: 'blush',     probability: 0.12, crossFadeDuration: 0.25 },
    { clipId: 'surprised', probability: 0.08, crossFadeDuration: 0.3  },
  ]},
  sarcastic: { variations: [
    { clipId: 'thinking',  probability: 0.25, crossFadeDuration: 0.3  },
    { clipId: 'relax',     probability: 0.10, crossFadeDuration: 0.3  },
  ]},
}

const FALLBACK: IdleProfile = EMOTION_IDLE_PROFILES.neutral

export function getIdleProfile(baselineMood: string): IdleProfile {
  return EMOTION_IDLE_PROFILES[baselineMood.toLowerCase()] ?? FALLBACK
}
