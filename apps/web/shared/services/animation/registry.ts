/**
 * OCP: добавить фичу = создать контроллер + вставить строку здесь.
 * Удалить фичу = убрать строку.
 * VrmRenderer.tsx не трогать.
 */

import type { IVrmController } from '@/shared/types/IVrmController'
import { BlinkController } from './controllers/BlinkController'
import { GazeController } from './controllers/gazeController/GazeController'
import { AnimationStateMachineController } from './controllers/stateMachine'
import { ExpressionController } from './controllers/ExpressionController'
import { buildAnimationGraph } from './buildAnimationGraph'

export function createVrmControllers(baselineMood?: string): IVrmController[] {
  const graphConfig = buildAnimationGraph(baselineMood ?? 'neutral')
  return [
    new BlinkController(),
    new GazeController(),
    new AnimationStateMachineController(graphConfig),
    new ExpressionController(),
  ]
}