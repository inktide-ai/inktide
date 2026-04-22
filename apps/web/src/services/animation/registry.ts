/**
 * OCP: добавить фичу = создать контроллер + вставить строку здесь.
 * Удалить фичу = убрать строку.
 * VrmRenderer.tsx не трогать.
 */

import type { IVrmController } from '../../ports/IVrmController'
import { BlinkController } from './controllers/BlinkController'
import { GazeController } from './controllers/GazeController'
import { AnimationStateMachineController } from './controllers/stateMachine'
import { ExpressionController } from './controllers/ExpressionController'

/**
 * Фабрика — каждый VrmRenderer получает собственные экземпляры контроллеров.
 * Порядок важен: обновление идёт сверху вниз каждый кадр.
 */
export function createVrmControllers(): IVrmController[] {
  return [
    new BlinkController(),
    new GazeController(),
    new AnimationStateMachineController(),
    new ExpressionController(),
  ]
}
