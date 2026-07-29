import * as THREE from 'three'
import type { IVrmController, VrmControllerSetup, VrmAnimationContext } from '@/shared/types/IVrmController'

const BREAST_RE = /bust|breast|boob/i

// Spring-damper constants
const K      = 5     // stiffness (1/s²)
const D      = 1.5   // damping   (1/s) - ζ~0.34, underdamped -> jiggle
const SENS   = 10.0  // camera angular velocity -> force multiplier
const SPREAD = 0.9   // gravityDir max lateral tilt
const MAX_F  = 20.0  // clamp raw force

interface JointEntry {
  joint: {
    settings: {
      stiffness: number
      gravityPower: number
      gravityDir: THREE.Vector3
      dragForce: number
    }
  }
  origStiffness: number
  origGravityPower: number
  origGravityDir: THREE.Vector3
  origDragForce: number
}

/**
 * Jiggle physics driven by SoulState.vad.arousal:
 *   arousal=+1 -> stiffness=0.22, gravityPower=0.30, jiggleMult=2.2
 *   arousal= 0 -> stiffness=0.13, gravityPower=0.20, jiggleMult=1.0
 *   arousal=-1 -> stiffness=0.03, gravityPower=0.10, jiggleMult=0.1
 *
 * Falls back to ctx.jiggleMult when soulState is null.
 */
export class JiggleController implements IVrmController {
  readonly id = 'jiggle'

  private dispX = 0; private dispZ = 0
  private velX  = 0; private velZ  = 0

  private prevCamQuat = new THREE.Quaternion()
  private entries: JointEntry[] = []
  private prevEnabled = false

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    vrm.springBoneManager?.joints.forEach(joint => {
      if (!BREAST_RE.test(joint.bone.name)) return
      this.entries.push({
        joint,
        origStiffness:    joint.settings.stiffness,
        origGravityPower: joint.settings.gravityPower,
        origGravityDir:   joint.settings.gravityDir.clone(),
        origDragForce:    joint.settings.dragForce,
      })
    })
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    if (!ctx.jiggleEnabled) {
      if (this.prevEnabled) { this._restore(); this._reset(); this.prevEnabled = false }
      this.prevCamQuat.copy(ctx.camera.quaternion)
      return
    }
    this.prevEnabled = true

    // Resolve arousal-driven multiplier
    const soul = ctx.soulState
    const a    = soul?.vad.a ?? 0

    const jiggleMult   = soul
      ? Math.min(Math.max(1.0 + a * 1.1, 0.1), 2.5)
      : ctx.jiggleMult
    const stiffness    = Math.min(Math.max(0.125 + a * 0.095, 0.02), 0.25)
    const gravityPower = Math.min(Math.max(0.20  + a * 0.10,  0.03), 0.30)

    const dq = ctx.camera.quaternion.clone().premultiply(this.prevCamQuat.clone().invert())
    this.prevCamQuat.copy(ctx.camera.quaternion)

    const safeD = Math.max(delta, 0.001)
    const clamp = (v: number) => Math.max(-MAX_F, Math.min(MAX_F, v))

    // Extract axis and angle from delta quaternion - dq.y/x are NOT angles
    const angle    = 2 * Math.acos(Math.min(Math.abs(dq.w), 1.0))
    const sinHalf  = Math.sqrt(Math.max(0, 1 - dq.w * dq.w))
    const axisY    = sinHalf > 0.001 ? dq.y / sinHalf : 0  // yaw  -> X sway
    const axisX    = sinHalf > 0.001 ? dq.x / sinHalf : 0  // pitch -> Z sway
    const angSpeed = angle / safeD                          // true rad/s

    const forceX = clamp(axisY * angSpeed * SENS * jiggleMult)
    const forceZ = clamp(axisX * angSpeed * SENS * jiggleMult)

    this.velX += (-K * this.dispX - D * this.velX + forceX) * delta
    this.velZ += (-K * this.dispZ - D * this.velZ + forceZ) * delta
    this.dispX = Math.max(-1, Math.min(1, this.dispX + this.velX * delta))
    this.dispZ = Math.max(-1, Math.min(1, this.dispZ + this.velZ * delta))

    for (const e of this.entries) {
      e.joint.settings.stiffness    = stiffness
      e.joint.settings.gravityPower = gravityPower * jiggleMult
      e.joint.settings.dragForce    = 0.2
      e.joint.settings.gravityDir.set(this.dispX * SPREAD, -1, this.dispZ * SPREAD).normalize()
    }
  }

  dispose(): void {
    this._restore()
    this._reset()
    this.entries = []
    this.prevEnabled = false
  }

  private _reset(): void {
    this.dispX = this.dispZ = this.velX = this.velZ = 0
  }

  private _restore(): void {
    for (const e of this.entries) {
      e.joint.settings.stiffness    = e.origStiffness
      e.joint.settings.gravityPower = e.origGravityPower
      e.joint.settings.gravityDir.copy(e.origGravityDir)
      e.joint.settings.dragForce    = e.origDragForce
    }
  }
}
