import type { IVisemeProvider } from '../../ports/IVisemeProvider'
import { RhubarbVisemeProvider } from './RhubarbVisemeProvider'
import { FormantVisemeProvider } from './FormantVisemeProvider'

/**
 * OCP EXTENSION POINT.
 *
 * Добавить новый lip-sync провайдер (ARKit, OVR, ...) = два шага:
 *   1. Создать src/services/lipsync/ARKitVisemeProvider.ts с `implements IVisemeProvider`
 *   2. Добавить импорт и элемент в этот массив
 *
 * useLipSync.ts НЕ МЕНЯЕТСЯ. Провайдеры проверяются по порядку; первый
 * у которого isApplicable() → true, используется для вычисления весов рта.
 * Rhubarb имеет приоритет над formant (более точный результат).
 */
export const visemeProviderRegistry: IVisemeProvider[] = [
  new RhubarbVisemeProvider(),
  new FormantVisemeProvider(),
]
