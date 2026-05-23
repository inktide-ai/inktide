import { getIdleProfile } from './emotionIdleMap'
import { DEFAULT_NODES, DEFAULT_TRANSITIONS, DEFAULT_CLIP_URLS } from './controllers/stateMachine/defaultGraph'
import type { AnimationGraphConfig, SelfTransition } from './controllers/stateMachine/types'

export function buildAnimationGraph(baselineMood: string): AnimationGraphConfig {
  const profile = getIdleProfile(baselineMood)

  const selfTransitions: SelfTransition[] = profile.variations.map(v => ({
    nodeId: 'idle',
    variationClipId: v.clipId,
    probability: v.probability,
    crossFadeDuration: v.crossFadeDuration,
  }))

  // breathing_idle is not in the default graph — add it if any variation references it
  const needsBreathing = profile.variations.some(v => v.clipId === 'breathing_idle')
  const extraNodes = needsBreathing ? [{ id: 'breathing_idle', looping: false }] : []
  const extraUrls: Record<string, string>  = needsBreathing ? { breathing_idle: '/idle/breathing_idle.vrma' } : {}

  return {
    nodes:           [...DEFAULT_NODES, ...extraNodes],
    transitions:     DEFAULT_TRANSITIONS,
    selfTransitions,
    clipUrls:        { ...DEFAULT_CLIP_URLS, ...extraUrls },
  }
}
