import * as THREE from 'three'
import { MathUtils } from 'three'
import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '@/shared/types/IVrmController'

const DEG2RAD = Math.PI / 180

// Surprised spike params
const SPIKE_ANGLE_RAD = 8 * DEG2RAD  // +8 deg
const SPIKE_RISE_SEC  = 0.10         // 100ms to spike
const SPIKE_FALL_SEC  = 0.60         // 600ms to return

/**
 * Applies subtle head tilt from SoulState.vad.dominance:
 *   dominance > 0 -> chin up (positive X rotation, up to +5 deg)
 *   dominance < 0 -> chin down (negative X rotation, down to -10 deg)
 *
 * Surprised attention spike: when attention jumps above 0.95 (rises > 0.3),
 * quickly tilts the head +8 deg over 100ms then returns over 600ms.
 * This is the Mihoyo-style "snap attention" micro-animation.
 *
 * No soulState -> no modification (safe fallback).
 */
export class HeadPoseController implements IVrmController {
  readonly id = 'head-pose'

  private headBone: THREE.Object3D | null = null
  private prevAttention = 0

  // Separate base rotation so spike never bleeds into the lerp target
  private baseRotX = 0

  // Surprised spike state
  private spikePhase: 'none' | 'rising' | 'falling' = 'none'
  private spikeProgress = 0

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    this.headBone = vrm.humanoid.getNormalizedBoneNode('head') ?? null
    this.baseRotX = 0
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    if (!this.headBone || !ctx.soulState) return

    const { vad, physical } = ctx.soulState
    const att = physical.attention

    // Detect surprised spike: attention crosses 0.95 with a large jump
    if (att > 0.95 && this.prevAttention < 0.65 && this.spikePhase === 'none') {
      this.spikePhase    = 'rising'
      this.spikeProgress = 0
    }
    this.prevAttention = att

    // 1. Advance base tilt independently from spike overlay
    const d             = vad.d
    const targetTiltDeg = d >= 0 ? d * 5 : d * 10
    const targetTiltRad = targetTiltDeg * DEG2RAD
    this.baseRotX = MathUtils.lerp(this.baseRotX, targetTiltRad, delta * 0.5)

    // 2. Advance spike animation and compute its current offset
    if (this.spikePhase !== 'none') {
      this._updateSpike(delta)
    }

    // 3. Apply base + spike as a clean sum - spike never contaminates baseRotX
    this.headBone.rotation.x = this.baseRotX + this._spikeOffset()
  }

  dispose(): void {
    this.headBone      = null
    this.spikePhase    = 'none'
    this.spikeProgress = 0
    this.prevAttention = 0
    this.baseRotX      = 0
  }

  private _updateSpike(delta: number): void {
    if (this.spikePhase === 'rising') {
      this.spikeProgress += delta / SPIKE_RISE_SEC
      if (this.spikeProgress >= 1) {
        this.spikeProgress = 1
        this.spikePhase    = 'falling'
      }
    } else {
      this.spikeProgress += delta / SPIKE_FALL_SEC
      if (this.spikeProgress >= 1) {
        this.spikeProgress = 0
        this.spikePhase    = 'none'
      }
    }
  }

  private _spikeOffset(): number {
    if (this.spikePhase === 'none') return 0
    if (this.spikePhase === 'rising') return SPIKE_ANGLE_RAD * this.spikeProgress
    return SPIKE_ANGLE_RAD * (1 - this.spikeProgress)
  }
}
