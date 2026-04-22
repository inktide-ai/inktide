import type { VRM } from '@pixiv/three-vrm'
import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '../../../ports/IVrmController'

const BLINK_DURATION = 0.2
const BLINK_MIN = 1.5
const BLINK_MAX = 6.0

interface BlinkState {
  isBlinking: boolean
  progress: number
  timeSinceLast: number
  nextBlinkAt: number
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export class BlinkController implements IVrmController {
  readonly id = 'blink'

  private vrm: VRM | null = null
  private state: BlinkState = {
    isBlinking: false,
    progress: 0,
    timeSinceLast: 0,
    nextBlinkAt: randomRange(BLINK_MIN, BLINK_MAX),
  }

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    this.vrm = vrm
  }

  update(delta: number, _ctx: VrmAnimationContext): void {
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
        s.nextBlinkAt = randomRange(BLINK_MIN, BLINK_MAX)
        vrm.expressionManager.setValue('blink', 0)
      }
    }
  }

  dispose(): void {
    this.vrm?.expressionManager?.setValue('blink', 0)
    this.vrm = null
  }
}
