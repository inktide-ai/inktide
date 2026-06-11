import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '@/shared/types/IVrmController'


const SACCADE_STEP = 400
const SACCADE_TABLE: [number, number][] = [
  [0.075, 800], [0.110, 0], [0.125, 0], [0.140, 0],
  [0.125, 0],   [0.050, 0], [0.040, 0], [0.030, 0],
  [0.020, 0],   [1.000, 0],
]

for (let i = 1; i < SACCADE_TABLE.length; i++) {
  SACCADE_TABLE[i][0] += SACCADE_TABLE[i - 1][0]
  SACCADE_TABLE[i][1]  = SACCADE_TABLE[i - 1][1] + SACCADE_STEP
}

function randomSaccadeInterval(energyScale: number): number {
  const r = Math.random()
  for (const [p, t] of SACCADE_TABLE) {
    if (r <= p) return (t + Math.random() * SACCADE_STEP) * energyScale
  }
  return (SACCADE_TABLE[SACCADE_TABLE.length - 1][1] + Math.random() * SACCADE_STEP) * energyScale
}


/**
 * Gaze controller with SoulState integration:
 *
 *  attention < 0.3 → override to idle saccade regardless of lookAtMode
 *    (character's focus drifts when not engaged)
 *
 *  energy < 0.1 → saccade interval ×3 (droopy, barely looking around)
 *
 *  attention > 0.95 (surprised spike) → saccade interval shrinks to 50ms for 1s
 *    (eyes dart around quickly on surprise)
 */
export class GazeController implements IVrmController {

  readonly id = 'gaze'

  private vrm: VRM | null = null
  private lookAtObj = new THREE.Object3D()

  private saccadeTarget = new THREE.Vector3(0, 1.3, -5)
  private saccadeTimeSinceLast = 0
  private saccadeNextAfter = -1

  // Surprise dart state — after a spike, eyes move rapidly for a brief window
  private surpriseDartRemaining = 0

  // Instance-owned scratch objects — safe for multi-avatar rendering
  private readonly _raycaster = new THREE.Raycaster()
  private readonly _mouseNdc  = new THREE.Vector2()
  private readonly _cameraDir = new THREE.Vector3()
  private readonly _plane     = new THREE.Plane()
  private readonly _hit       = new THREE.Vector3()

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    this.vrm = vrm
    vrm.lookAt && (vrm.lookAt.target = this.lookAtObj)
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    const vrm = this.vrm
    if (!vrm?.lookAt) return

    vrm.lookAt.target = this.lookAtObj

    const soul      = ctx.soulState
    const attention = soul?.physical.attention ?? 1.0
    const energy    = soul?.physical.energy    ?? 1.0

    // Surprise dart window
    if (soul && attention > 0.95) {
      this.surpriseDartRemaining = 1.0 // 1 second of rapid saccade
    }
    if (this.surpriseDartRemaining > 0) {
      this.surpriseDartRemaining -= delta
    }

    // When attention is very low, override mode to idle regardless of setting
    const effectiveMode = attention < 0.3 ? 'idle' : ctx.lookAtMode

    switch (effectiveMode) {
      case 'camera':
        this.lookAtObj.position.copy(ctx.camera.position)
        vrm.lookAt.update(delta)
        break

      case 'mouse': {
        const t = this._worldPosFromMouse(ctx.mouse.x, ctx.mouse.y, ctx.camera)
        if (t) this.lookAtObj.position.lerp(t, 1 - Math.pow(0.9, delta * 60))
        vrm.lookAt.update(delta)
        break
      }

      case 'disabled':
        this.lookAtObj.position.set(0, 1.3, -100)
        vrm.lookAt.update(delta)
        break

      case 'idle':
      default:
        this._updateSaccade(delta, energy)
        vrm.lookAt.update(delta)
    }
  }

  private _updateSaccade(delta: number, energy: number): void {
    this.saccadeTimeSinceLast += delta

    // Energy scale: sleepy = 3× slower saccades; surprise dart = 50ms intervals
    const energyScale = this.surpriseDartRemaining > 0
      ? 0.05 / 0.4                // ~50ms interval during dart
      : energy < 0.1
        ? 3.0                     // sleepy: very slow
        : 1.0

    if (this.saccadeTimeSinceLast >= this.saccadeNextAfter) {
      this.saccadeTarget.set(
        (Math.random() - 0.5) * 0.5,
        1.3 + (Math.random() - 0.5) * 0.4,
        -5,
      )
      this.saccadeTimeSinceLast = 0
      this.saccadeNextAfter = randomSaccadeInterval(energyScale) / 1000
    }

    // Frame-rate independent lerp — normalised to 60 fps
    this.lookAtObj.position.lerp(this.saccadeTarget, 1 - Math.pow(0.9, delta * 60))
  }

  private _worldPosFromMouse(
    mouseX: number,
    mouseY: number,
    camera: THREE.PerspectiveCamera,
  ): THREE.Vector3 | null {
    // TODO: pass canvas dimensions via VrmAnimationContext to avoid window mismatch
    this._mouseNdc.x = (mouseX / window.innerWidth) * 2 - 1
    this._mouseNdc.y = -(mouseY / window.innerHeight) * 2 + 1
    this._raycaster.setFromCamera(this._mouseNdc, camera)
    camera.getWorldDirection(this._cameraDir)
    this._plane.setFromNormalAndCoplanarPoint(
      this._cameraDir,
      camera.position.clone().add(this._cameraDir.clone().multiplyScalar(1)),
    )
    return this._raycaster.ray.intersectPlane(this._plane, this._hit)
  }

  dispose(): void {
    this.vrm = null
  }
}
