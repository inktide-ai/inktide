import * as THREE from 'three'
import type { VRM } from '@pixiv/three-vrm'
import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '../../../../ports/IVrmController'

// ── Saccade probability table (реалистичные движения глаз) ───────────────────

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

function randomSaccadeInterval(): number {
  const r = Math.random()
  for (const [p, t] of SACCADE_TABLE) {
    if (r <= p) return t + Math.random() * SACCADE_STEP
  }
  return SACCADE_TABLE[SACCADE_TABLE.length - 1][1] + Math.random() * SACCADE_STEP
}


const _raycaster = new THREE.Raycaster()
const _mouseNdc  = new THREE.Vector2()
const _cameraDir = new THREE.Vector3()
const _plane     = new THREE.Plane()
const _hit       = new THREE.Vector3()

function worldPosFromMouse(
  mouseX: number,
  mouseY: number,
  camera: THREE.PerspectiveCamera,
): THREE.Vector3 | null {
  _mouseNdc.x = (mouseX / window.innerWidth) * 2 - 1
  _mouseNdc.y = -(mouseY / window.innerHeight) * 2 + 1
  _raycaster.setFromCamera(_mouseNdc, camera)
  camera.getWorldDirection(_cameraDir)
  _plane.setFromNormalAndCoplanarPoint(
    _cameraDir,
    camera.position.clone().add(_cameraDir.clone().multiplyScalar(1)),
  )
  return _raycaster.ray.intersectPlane(_plane, _hit)
}


export class GazeController implements IVrmController {
  
  readonly id = 'gaze'

  private vrm: VRM | null = null
  private lookAtObj = new THREE.Object3D()

  private saccadeTarget = new THREE.Vector3(0, 1.3, -5)
  private saccadeTimeSinceLast = 0
  private saccadeNextAfter = -1

  async init({ vrm }: VrmControllerSetup): Promise<void> {
    this.vrm = vrm
    vrm.lookAt && (vrm.lookAt.target = this.lookAtObj)
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    const vrm = this.vrm
    if (!vrm?.lookAt) return

    vrm.lookAt.target = this.lookAtObj

    switch (ctx.lookAtMode) {
      case 'camera':
        this.lookAtObj.position.copy(ctx.camera.position)
        vrm.lookAt.update(delta)
        break

      case 'mouse': {
        const t = worldPosFromMouse(ctx.mouse.x, ctx.mouse.y, ctx.camera)
        if (t) this.lookAtObj.position.lerp(t, 0.1)
        vrm.lookAt.update(delta)
        break
      }

      case 'disabled':
        this.lookAtObj.position.set(0, 1.3, -100)
        vrm.lookAt.update(delta)
        break

      case 'idle':
      default:
        this._updateSaccade(delta)
        vrm.lookAt.update(delta)
    }
  }

  private _updateSaccade(delta: number): void {
    this.saccadeTimeSinceLast += delta

    if (this.saccadeTimeSinceLast >= this.saccadeNextAfter) {
      this.saccadeTarget.set(
        (Math.random() - 0.5) * 0.5,
        1.3 + (Math.random() - 0.5) * 0.4,
        -5,
      )
      this.saccadeTimeSinceLast = 0
      this.saccadeNextAfter = randomSaccadeInterval() / 1000
    }

    this.lookAtObj.position.lerp(this.saccadeTarget, 0.1)
  }

  dispose(): void {
    this.vrm = null
  }
}
