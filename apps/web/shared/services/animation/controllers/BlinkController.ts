import type { VRM } from '@pixiv/three-vrm'
import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '@/shared/types/IVrmController'

const BLINK_DURATION = 0.2

interface BlinkState {
  isBlinking: boolean
  progress: number
  timeSinceLast: number
  nextBlinkAt: number
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Blink interval is driven by SoulState.vad.arousal:
 *   high arousal (excited/surprised) → fast blink (min 0.8s, max 2.0s)
 *   low arousal (relax/sleepy)       → slow blink (min 1.2s, max 5.1s)
 *   energy < 0.1                     → droopy blink (min 1.0s, max 1.5s)
 *
 * Falls back to legacy constant range when soulState is null.
 */
export class BlinkController implements IVrmController {
  readonly id = 'blink'

  private vrm: VRM | null = null
  private state: BlinkState = {
    isBlinking: false,
    progress: 0,
    timeSinceLast: 0,
    nextBlinkAt: randomRange(1.5, 6.0),
  }

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    this.vrm = vrm
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    const vrm = this.vrm
    if (!vrm?.expressionManager) return
    const s = this.state

    s.timeSinceLast += delta

    if (!s.isBlinking && s.timeSinceLast >= s.nextBlinkAt) {
      s.isBlinking = true
      s.progress = 0
    }

    if (s.isBlinking) {
      s.progress += delta / BLINK_DURATION
      vrm.expressionManager.setValue('blink', Math.sin(Math.PI * s.progress))
      if (s.progress >= 1) {
        s.isBlinking = false
        s.timeSinceLast = 0
        s.nextBlinkAt = this._nextBlinkAt(ctx)
        vrm.expressionManager.setValue('blink', 0)
      }
    }
  }

  dispose(): void {
    this.vrm?.expressionManager?.setValue('blink', 0)
    this.vrm = null
  }

  private _nextBlinkAt(ctx: VrmAnimationContext): number {
    const soul = ctx.soulState
    if (!soul) return randomRange(1.5, 6.0)

    const a      = soul.vad.a
    const energy = soul.physical.energy

    // Sleepy override: droopy frequent partial blinks
    if (energy < 0.1) return randomRange(1.0, 1.5)

    // Arousal-driven range: a in [-1,+1] → min [1.2,0.8], max [5.1,2.0]
    const minInterval = 0.8 + (1 - a) * 0.2  // 0.8s (arousal=1) → 1.2s (arousal=-1)
    const maxInterval = 2.0 + (1 - a) * 1.55 // 2.0s (arousal=1) → 5.1s (arousal=-1)
    return randomRange(minInterval, maxInterval)
  }
}
