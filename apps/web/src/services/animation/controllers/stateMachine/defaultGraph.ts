import type { AnimationGraphConfig, AnimationNode, AnimationTransition, SelfTransition } from './types'

import idleUrl      from '../../../../assets/app/idle_loop.vrma?url'
import angryUrl     from '../../../../assets/app/animations/Angry.vrma?url'
import blushUrl     from '../../../../assets/app/animations/Blush.vrma?url'
import clappingUrl  from '../../../../assets/app/animations/Clapping.vrma?url'
import sadUrl       from '../../../../assets/app/animations/Sad.vrma?url'
import surprisedUrl from '../../../../assets/app/animations/Surprised.vrma?url'
import relaxUrl     from '../../../../assets/app/animations/Relax.vrma?url'
import sleepyUrl    from '../../../../assets/app/animations/Sleepy.vrma?url'
import thinkingUrl  from '../../../../assets/app/animations/Thinking.vrma?url'

// ── Nodes ─────────────────────────────────────────────────────────────────────

const EMOTE_IDS = ['angry', 'blush', 'happy', 'sad', 'surprised', 'relax', 'sleepy', 'thinking'] as const
type EmoteId = typeof EMOTE_IDS[number]

export const DEFAULT_NODES: AnimationNode[] = [
  { id: 'idle', looping: true },
  ...EMOTE_IDS.map((id): AnimationNode => ({ id, looping: false })),
]

export const DEFAULT_CLIP_URLS: Record<string, string> = {
  idle:      idleUrl,
  angry:     angryUrl,
  blush:     blushUrl,
  happy:     clappingUrl,
  sad:       sadUrl,
  surprised: surprisedUrl,
  relax:     relaxUrl,
  sleepy:    sleepyUrl,
  thinking:  thinkingUrl,
}

// ── Transitions ───────────────────────────────────────────────────────────────

const idleToEmote = (id: EmoteId): AnimationTransition => ({
  from: 'idle',
  to: id,
  crossFadeDuration: 0.3,
  concurrency: 'replace',
  reversible: id === 'angry',  // angry can be reversed mid-flight
  keyframes: [],               // populate with wind-up clip when available
})

const emoteToIdle = (id: EmoteId): AnimationTransition => ({
  from: id,
  to: 'idle',
  crossFadeDuration: 0.3,
  concurrency: 'replace',
  reversible: false,
  keyframes: [],
})

export const DEFAULT_TRANSITIONS: AnimationTransition[] = [
  ...EMOTE_IDS.map(idleToEmote),
  ...EMOTE_IDS.map(emoteToIdle),
]

// ── Self-transitions (idle variations) ───────────────────────────────────────

export const DEFAULT_SELF_TRANSITIONS: SelfTransition[] = [
  // Example — uncomment and supply a clip URL when breathing_idle.vrma is ready:
  // { nodeId: 'idle', variationClipId: 'breathing_idle', probability: 0.15, crossFadeDuration: 0.3 },
]

// ── Assembled config ──────────────────────────────────────────────────────────

export const DEFAULT_GRAPH_CONFIG: AnimationGraphConfig = {
  nodes:           DEFAULT_NODES,
  transitions:     DEFAULT_TRANSITIONS,
  selfTransitions: DEFAULT_SELF_TRANSITIONS,
  clipUrls:        DEFAULT_CLIP_URLS,
}
