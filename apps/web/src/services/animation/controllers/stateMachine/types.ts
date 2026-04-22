import type * as THREE from 'three'

// ── Zira-Games concepts ported to TypeScript/VRM ─────────────────────────────

/** Named node in the animation graph. Equivalent to Zira's Idle('angry'). */
export interface AnimationNode {
  readonly id: string
  /** Looping nodes (idle variants) vs one-shot emotes. */
  readonly looping: boolean
}

/**
 * Intermediate pose within a transition — e.g. a wind-up before 'angry'.
 * Equivalent to AnimationKeyframe in Zira.
 */
export interface AnimationKeyframe {
  clipId: string
  duration: number  // seconds
  fadeIn: number    // seconds — cross-fade from previous clip
}

/**
 * Directed edge in the animation graph.
 * Equivalent to Transition in Zira.
 */
export interface AnimationTransition {
  from: string
  to: string
  /** Cross-fade duration for the final blend into the target clip (seconds). */
  crossFadeDuration: number
  /** What to do when a new transition arrives mid-flight. */
  concurrency: TransitionConcurrencyBehavior
  /** Whether the transition can be reversed while in-flight. */
  reversible: boolean
  /** Optional intermediate clips played before the final target. */
  keyframes?: AnimationKeyframe[]
}

/**
 * Looping variation that starts and ends on the same node.
 * Equivalent to SelfTransition in Zira.
 */
export interface SelfTransition {
  nodeId: string
  variationClipId: string
  /** 0–1 chance to trigger at end of each idle cycle. */
  probability: number
  crossFadeDuration: number
}

/**
 * What happens when a transition is requested while one is already running.
 * Equivalent to TransitionConcurrencyBehavior in Zira.
 */
export type TransitionConcurrencyBehavior = 'ignore' | 'replace' | 'sequence'

// ── XState machine types ──────────────────────────────────────────────────────

export interface AnimationMachineContext {
  activeNodeId: string
  requestedEmotion: string | null
  activeTransition: InTransitionState | null
  queuedEmotion: string | null
}

/** Equivalent to Zira's InTransition(progress, from, to, playState). */
export interface InTransitionState {
  fromNodeId: string
  toNodeId: string
  /** Normalised 0–1 progress through the full transition. */
  progress: number
  /** Elapsed time in seconds. */
  elapsed: number
  /** Total time budget in seconds (sum of keyframe durations + crossFadeDuration). */
  totalDuration: number
  remainingKeyframes: AnimationKeyframe[]
  crossFadeDuration: number
  reversible: boolean
  paused: boolean
}

export type AnimationMachineEvent =
  | { type: 'EMOTION_SET'; emotion: string }
  | { type: 'EMOTION_CLEARED' }
  | { type: 'CLIP_READY'; nodeId: string }
  | { type: 'TRANSITION_COMPLETE' }
  | { type: 'KEYFRAME_COMPLETE' }
  | { type: 'IDLE_CYCLE_COMPLETE' }
  | { type: 'PAUSE_TRANSITION' }
  | { type: 'RESUME_TRANSITION' }

// ── AnimationProperty — Zira concept ─────────────────────────────────────────

/**
 * Evaluates a typed value T from the current machine snapshot.
 * Equivalent to AnimationProperty<T, S> in Zira.
 */
export type AnimationProperty<T> = (context: AnimationMachineContext) => T

// ── Graph config ──────────────────────────────────────────────────────────────

export interface AnimationGraphConfig {
  nodes: AnimationNode[]
  transitions: AnimationTransition[]
  selfTransitions: SelfTransition[]
  clipUrls: Record<string, string>
}

// ── ClipRegistry entry ────────────────────────────────────────────────────────

export interface ClipEntry {
  nodeId: string
  vrmaUrl: string
  action: THREE.AnimationAction | null
}
