/**
 * OCP: добавить фичу = создать контроллер + вставить строку здесь.
 * Удалить фичу = убрать строку.
 * VrmRenderer.tsx не трогать.
 */

import type { IVrmController } from '@/types/IVrmController'
import { BlinkController } from './controllers/BlinkController'
import { GazeController } from './controllers/gazeController/GazeController'
import { AnimationStateMachineController } from './controllers/stateMachine'
import { ExpressionController } from './controllers/ExpressionController'

/**
 * Фабрика — каждый VrmRenderer получает собственные экземпляры контроллеров.
 * Порядок важен: обновление идёт сверху вниз каждый кадр.
 */
type ControllerFactory = () => IVrmController

const CONTROLLER_FACTORIES: ControllerFactory[] = [
  () => new BlinkController(),
  () => new GazeController(),
  () => new AnimationStateMachineController(),
  () => new ExpressionController(),
]

export function createVrmControllers(): IVrmController[] {
  return CONTROLLER_FACTORIES.map(f => f())
}