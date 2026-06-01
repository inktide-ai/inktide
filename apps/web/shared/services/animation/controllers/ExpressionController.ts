import type { VRM } from '@pixiv/three-vrm'
import { MathUtils } from 'three'
import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '@/shared/types/IVrmController'

// Только face expressions. Mouth expressions (aa/ih/ou/ee/oh) и blink — чужая ответственность.
const MANAGED_EXPRESSIONS = [
  'happy', 
  'sad', 
  'angry',
  'surprised',
  'relaxed'
] as const

type ManagedExpression = (typeof MANAGED_EXPRESSIONS)[number]

const EMOTION_EXPRESSION_MAP: Record<string, ManagedExpression> = {
  angry:     'angry',
  sad:       'sad',
  surprised: 'surprised',
  happy:     'happy',
  excited:   'happy',
  blush:     'happy',
  relax:     'relaxed',
  sleepy:    'relaxed',
  thinking:  'relaxed',
  sarcastic: 'relaxed',
}

const LERP_SPEED = 3 // скорость перехода (в секундах^-1)

export class ExpressionController implements IVrmController {
  readonly id = 'expression'

  private vrm: VRM | null = null

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    this.vrm = vrm
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    const em = this.vrm?.expressionManager
    if (!em) return

    const mapped = ctx.emotion.emotion
      ? EMOTION_EXPRESSION_MAP[ctx.emotion.emotion]
      : undefined
    // Unknown emotions silently fall back to neutral — no warn spam in production
    const targetExpr = mapped ?? null

    const targetIntensity = ctx.emotion.intensity

    for (const expr of MANAGED_EXPRESSIONS) {
      const current = em.getValue(expr) ?? 0
      const target  = expr === targetExpr ? targetIntensity : 0
      em.setValue(expr, MathUtils.lerp(current, target, delta * LERP_SPEED))
    }
  }

  dispose(): void {
    const em = this.vrm?.expressionManager
    if (em) {
      for (const expr of MANAGED_EXPRESSIONS) {
        em.setValue(expr, 0)
      }
    }
    this.vrm = null
  }
}

