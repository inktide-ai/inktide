import type { CharacterPersonality } from '@/lib/character'

export type PresetKey = 'streamer' | 'mentor' | 'comedian' | 'philosopher' | 'tsundere' | 'supportive' | 'tactical'

export const PERSONALITY_PRESETS: Record<PresetKey, CharacterPersonality> = {
  streamer:    { warmth: 0.80, playfulness: 0.85, assertiveness: 0.60, empathy: 0.70, formality: 0.10, sarcasm: 0.30, emotionVolatility: 0.70, emotionResponsiveness: 0.85, emotionMemory: 0.40, stressBehavior: 'humor',    baselineMood: 'happy',   presetId: 'streamer' },
  mentor:      { warmth: 0.75, playfulness: 0.30, assertiveness: 0.70, empathy: 0.90, formality: 0.70, sarcasm: 0.05, emotionVolatility: 0.20, emotionResponsiveness: 0.60, emotionMemory: 0.80, stressBehavior: 'withdraw', baselineMood: 'neutral', presetId: 'mentor' },
  comedian:    { warmth: 0.65, playfulness: 0.95, assertiveness: 0.50, empathy: 0.50, formality: 0.05, sarcasm: 0.70, emotionVolatility: 0.90, emotionResponsiveness: 0.95, emotionMemory: 0.20, stressBehavior: 'humor',    baselineMood: 'hyped',   presetId: 'comedian' },
  philosopher: { warmth: 0.50, playfulness: 0.20, assertiveness: 0.65, empathy: 0.60, formality: 0.80, sarcasm: 0.15, emotionVolatility: 0.15, emotionResponsiveness: 0.40, emotionMemory: 0.90, stressBehavior: 'withdraw', baselineMood: 'neutral', presetId: 'philosopher' },
  tsundere:    { warmth: 0.20, playfulness: 0.60, assertiveness: 0.80, empathy: 0.35, formality: 0.20, sarcasm: 0.75, emotionVolatility: 0.85, emotionResponsiveness: 0.80, emotionMemory: 0.60, stressBehavior: 'confront', baselineMood: 'neutral', presetId: 'tsundere' },
  supportive:  { warmth: 0.90, playfulness: 0.40, assertiveness: 0.35, empathy: 0.95, formality: 0.30, sarcasm: 0.05, emotionVolatility: 0.25, emotionResponsiveness: 0.75, emotionMemory: 0.85, stressBehavior: 'deflect',  baselineMood: 'chill',   presetId: 'supportive' },
  tactical:    { warmth: 0.30, playfulness: 0.20, assertiveness: 0.90, empathy: 0.40, formality: 0.75, sarcasm: 0.20, emotionVolatility: 0.30, emotionResponsiveness: 0.55, emotionMemory: 0.70, stressBehavior: 'confront', baselineMood: 'neutral', presetId: 'tactical' },
}

export interface PresetMeta {
  label: string
  tagline: string
  dots: [number, number, number]
}

export const PERSONALITY_PRESET_META: Record<PresetKey | 'custom', PresetMeta> = {
  streamer:    { label: 'Streamer',    tagline: 'Live & reactive',  dots: [0.80, 0.85, 0.70] },
  mentor:      { label: 'Mentor',      tagline: 'Calm & guiding',   dots: [0.75, 0.20, 0.90] },
  comedian:    { label: 'Comedian',    tagline: 'Chaotic energy',   dots: [0.65, 0.90, 0.50] },
  philosopher: { label: 'Philosopher', tagline: 'Measured & deep',  dots: [0.50, 0.15, 0.60] },
  tsundere:    { label: 'Tsundere',    tagline: 'Sharp & cold',     dots: [0.20, 0.85, 0.35] },
  supportive:  { label: 'Supportive',  tagline: 'Warm & patient',   dots: [0.90, 0.25, 0.95] },
  tactical:    { label: 'Tactical',    tagline: 'Focused & direct', dots: [0.30, 0.30, 0.40] },
  custom:      { label: 'Custom',      tagline: 'Your config',      dots: [0.50, 0.50, 0.50] },
}

export const ALL_PRESET_KEYS: Array<PresetKey | 'custom'> = [
  'streamer', 'mentor', 'comedian', 'philosopher',
  'tsundere', 'supportive', 'tactical', 'custom',
]
