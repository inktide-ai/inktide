/**
 * OCP: добавить новый контроллер = создать файл с `implements IVrmController`
 * и добавить его в services/animation/registry.ts. VrmRenderer НЕ МЕНЯЕТСЯ.
 *
 * Удалить контроллер = убрать из registry (1 строка).
 */

import type { VRM } from '@pixiv/three-vrm'
import type * as THREE from 'three'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { MouthWeights } from './IVisemeProvider'
export type LookAtMode = 'idle' | 'camera' | 'mouse' | 'disabled'

export interface EmotionState {
  /** null = нет активной эмоции */
  emotion: string | null
  /** 0-1 */
  intensity: number
}

/**
 * Single source of truth for character aliveness.
 * All animation controllers read from here - changing SoulState changes
 * voice, body physics, blink rhythm and head posture simultaneously.
 */
export interface SoulState {
  /** Valence-Arousal-Dominance, each axis in [-1, +1] */
  vad: { v: number; a: number; d: number }
  /**
   * Physical state - updated per-message and decays between messages.
   * energy < 0.1 -> sleepy override on all controllers
   * attention < 0.3 -> force idle gaze regardless of lookAtMode
   */
  physical: { energy: number; attention: number; comfort: number }
}

/** Передаётся в IVrmController.init() после загрузки VRM модели. */
export interface VrmControllerSetup {
  vrm: VRM
  mixer: THREE.AnimationMixer
  loader: GLTFLoader
}

/** Контекст, доступный каждому контроллеру на каждом кадре. */
export interface VrmAnimationContext {
  mouthWeights: MouthWeights | null
  /** true если хотя бы один вес рта > 0.1 */
  isTalking: boolean
  emotion: EmotionState
  camera: THREE.PerspectiveCamera
  mouse: { x: number; y: number }
  lookAtMode: LookAtMode
  jiggleEnabled: boolean
  /** 0.5-3.0; масштабирует амплитуду JiggleController (fallback если soulState недоступен) */
  jiggleMult: number
  /**
   * SoulState - VAD vector + PhysicalState. Null until first audioReceived from SignalR.
   * Controllers must handle null gracefully and fall back to legacy ctx fields.
   */
  soulState: SoulState | null
  /** Если false - AnimationStateMachineController не запускает случайные idle-вариации */
  randomAnimationsEnabled: boolean
}

export interface IVrmController {
  readonly id: string
  /** Вызывается один раз после загрузки VRM модели. Может быть async (загрузка VRMA). */
  init(setup: VrmControllerSetup): Promise<void>
  /** Вызывается каждый кадр перед vrm.update(). */
  update(delta: number, ctx: VrmAnimationContext): void
  /** Вызывается при размонтировании - освободить ресурсы, остановить actions. */
  dispose(): void
}
