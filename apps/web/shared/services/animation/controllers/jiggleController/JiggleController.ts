import * as THREE from 'three'
import type { IVrmController, VrmControllerSetup, VrmAnimationContext } from '@/shared/types/IVrmController'

// Matches VRoid Studio bust/breast spring bone naming conventions
const BREAST_RE = /bust|breast|boob/i

export class JiggleController implements IVrmController {
  readonly id = 'jiggle'

  private phase = 0
  private parents: THREE.Object3D[] = []

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    const seen = new Set<THREE.Object3D>()
    vrm.springBoneManager?.joints.forEach(joint => {
      if (!BREAST_RE.test(joint.bone.name)) return
      const parent = joint.bone.parent
      if (!parent || seen.has(parent)) return
      seen.add(parent)
      this.parents.push(parent)
    })
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    if (!ctx.jiggleEnabled || this.parents.length === 0) return

    this.phase += delta * 7  // ~7 rad/s ≈ natural frequency
    const amp = 0.012 * ctx.jiggleMult

    // Primary: vertical bob; secondary: slight lateral wobble (offset phase)
    const dy = Math.sin(this.phase) * amp
    const dz = Math.sin(this.phase * 0.7 + 0.8) * amp * 0.4

    for (const bone of this.parents) {
      bone.rotation.x += dy
      bone.rotation.z += dz
    }
  }

  dispose(): void {
    this.parents = []
    this.phase = 0
  }
}
