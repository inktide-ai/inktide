import * as THREE from 'three'

/**
 * Stateless Three.js blend helpers.
 * All decisions about WHEN to call these live in AnimationStateMachineController.
 * These functions only know HOW to execute a blend.
 */

/** Cross-fade into a one-shot emote clip. */
export function crossFadeTo(
  from: THREE.AnimationAction,
  to: THREE.AnimationAction,
  duration: number,
): void {
  to.reset()
  to.setLoop(THREE.LoopOnce, 1)
  to.clampWhenFinished = true
  from.crossFadeTo(to, duration, true)
  to.play()
}

/** Cross-fade into a looping clip (e.g. returning to idle). */
export function crossFadeToLooping(
  from: THREE.AnimationAction,
  to: THREE.AnimationAction,
  duration: number,
): void {
  to.reset()
  to.setLoop(THREE.LoopRepeat, Infinity)
  from.crossFadeTo(to, duration, true)
  to.play()
}

/**
 * Play an intermediate keyframe clip.
 * Equivalent to Zira's keyframe blending within a Transition.
 */
export function playKeyframe(
  from: THREE.AnimationAction | null,
  to: THREE.AnimationAction,
  fadeIn: number,
): void {
  to.reset()
  to.setLoop(THREE.LoopOnce, 1)
  to.clampWhenFinished = true
  if (from && fadeIn > 0) {
    from.crossFadeTo(to, fadeIn, true)
  }
  to.play()
}

/**
 * Returns true when a clip has reached within `threshold` seconds of its end.
 * Equivalent to Zira's checkCompletion logic.
 */
export function isActionNearEnd(
  action: THREE.AnimationAction,
  threshold = 0.4,
): boolean {
  return action.time >= action.getClip().duration - threshold
}

/** Hard-stop all actions on a mixer. Used during dispose. */
export function stopAll(mixer: THREE.AnimationMixer): void {
  mixer.stopAllAction()
}
