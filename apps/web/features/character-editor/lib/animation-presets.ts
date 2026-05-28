export const ANIMATION_PRESETS = ['Idle', 'Talk', 'Dance', 'Wave'] as const
export type AnimationPreset = typeof ANIMATION_PRESETS[number]
