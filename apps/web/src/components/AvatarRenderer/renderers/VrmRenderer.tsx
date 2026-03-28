import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import type { VRM } from '@pixiv/three-vrm'
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from '@pixiv/three-vrm-animation'

import idleAnimationUrl from '../../../assets/idle_loop.vrma?url'

interface VrmRendererProps {
  url: string
  background?: string
  className?: string
}

// ── Blink state ──────────────────────────────────────────────────────────────

interface BlinkState {
  isBlinking: boolean
  progress: number        // 0→1 over BLINK_DURATION
  timeSinceLast: number
  nextBlinkAt: number     // seconds
}

const BLINK_DURATION = 0.2
const BLINK_MIN = 1.5
const BLINK_MAX = 6.0

function makeBlink(): BlinkState {
  return { isBlinking: false, progress: 0, timeSinceLast: 0, nextBlinkAt: randomRange(BLINK_MIN, BLINK_MAX) }
}

function updateBlink(state: BlinkState, vrm: VRM, delta: number) {
  if (!vrm.expressionManager) return
  state.timeSinceLast += delta

  if (!state.isBlinking && state.timeSinceLast >= state.nextBlinkAt) {
    state.isBlinking = true
    state.progress = 0
  }

  if (state.isBlinking) {
    state.progress += delta / BLINK_DURATION
    vrm.expressionManager.setValue('blink', Math.sin(Math.PI * state.progress))
    if (state.progress >= 1) {
      state.isBlinking = false
      state.timeSinceLast = 0
      state.nextBlinkAt = randomRange(BLINK_MIN, BLINK_MAX)
      vrm.expressionManager.setValue('blink', 0)
    }
  }
}

// ── Eye saccades ──────────────────────────────────────────────────────────────

// Probability table from airi — weighted random interval between micro-movements
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

interface SaccadeState {
  timeSinceLast: number
  nextAfter: number       // seconds
  target: THREE.Vector3
  lookAtObj: THREE.Object3D
}

function makeSaccade(): SaccadeState {
  return {
    timeSinceLast: 0,
    nextAfter: -1,
    target: new THREE.Vector3(0, 1.3, -5),
    lookAtObj: new THREE.Object3D(),
  }
}

function updateSaccade(state: SaccadeState, vrm: VRM, delta: number) {
  if (!vrm.lookAt) return
  state.timeSinceLast += delta

  if (state.timeSinceLast >= state.nextAfter) {
    state.target.set(
      randomRange(-0.25, 0.25),
      1.3 + randomRange(-0.2, 0.2),
      -5,
    )
    state.timeSinceLast = 0
    state.nextAfter = randomSaccadeInterval() / 1000
  }

  if (!vrm.lookAt.target) vrm.lookAt.target = state.lookAtObj
  vrm.lookAt.target.position.lerp(state.target, 0.1)
  vrm.lookAt.update(delta)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function VrmRenderer({ url, background = 'transparent', className }: VrmRendererProps) {
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let renderer: THREE.WebGLRenderer | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let controls: OrbitControls | null = null
    let mixer: THREE.AnimationMixer | null = null
    let animationId: number
    let vrm: VRM | null = null
    let initialized = false
    let modelReady = false
    const clock = new THREE.Clock()
    const blink = makeBlink()
    const saccade = makeSaccade()

    const scene = new THREE.Scene()
    if (background !== 'transparent') scene.background = new THREE.Color(background)

    scene.add(new THREE.AmbientLight(0xffffff, 1.5))
    const dir = new THREE.DirectionalLight(0xffffff, 1.0)
    dir.position.set(1, 2, 3)
    scene.add(dir)

    // Load VRM
    const loader = new GLTFLoader()
    loader.register((parser) => new VRMLoaderPlugin(parser))
    loader.register((parser) => new VRMAnimationLoaderPlugin(parser))

    loader.load(
      url,
      async (gltf) => {
        const loaded = gltf.userData.vrm as VRM | undefined ?? null
        if (!loaded) return

        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)

        const box = new THREE.Box3().setFromObject(loaded.scene)
        const height = box.max.y - box.min.y
        const center = box.getCenter(new THREE.Vector3())
        loaded.scene.position.y = -box.min.y - height * 0.1

        if (camera) {
          camera.position.set(0, height * 0.55, 2.5)
          controls?.target.set(center.x, height * 0.55, center.z)
          controls?.update()
        }

        scene.add(loaded.scene)
        vrm = loaded

        // Load idle animation
        try {
          const animGltf = await loader.loadAsync(idleAnimationUrl)
          const vrmAnims = animGltf.userData.vrmAnimations
          if (vrmAnims?.length) {
            const clip = createVRMAnimationClip(vrmAnims[0], loaded)
            mixer = new THREE.AnimationMixer(loaded.scene)
            mixer.clipAction(clip).play()
          }
        } catch (e) {
          console.warn('[VrmRenderer] idle animation load failed', e)
        }

        modelReady = true
        if (initialized) startLoop()
      },
      undefined,
      (err) => console.error('[VrmRenderer] load error', err),
    )

    function startLoop() {
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        const delta = clock.getDelta()
        controls?.update()
        mixer?.update(delta)
        if (vrm) {
          updateBlink(blink, vrm, delta)
          updateSaccade(saccade, vrm, delta)
          vrm.update(delta)
        }
        if (renderer && camera) renderer.render(scene, camera)
      }
      animate()
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (!w || !h) continue

        if (!initialized) {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background === 'transparent' })
          renderer.setPixelRatio(window.devicePixelRatio)
          renderer.setSize(w, h)
          renderer.outputColorSpace = THREE.SRGBColorSpace
          renderer.toneMapping = THREE.ACESFilmicToneMapping
          renderer.toneMappingExposure = 1.0
          wrap.appendChild(renderer.domElement)

          camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 20)
          camera.position.set(0, 1.3, 2.5)

          controls = new OrbitControls(camera, renderer.domElement)
          controls.enableDamping = true
          controls.dampingFactor = 0.05
          controls.target.set(0, 1.3, 0)
          controls.update()

          initialized = true
          if (modelReady) startLoop()
        } else {
          renderer?.setSize(w, h)
          if (camera) {
            camera.aspect = w / h
            camera.updateProjectionMatrix()
          }
        }
      }
    })

    ro.observe(wrap)

    return () => {
      cancelAnimationFrame(animationId)
      ro.disconnect()
      controls?.dispose()
      mixer?.stopAllAction()
      if (vrm) {
        VRMUtils.deepDispose(vrm.scene)
        scene.remove(vrm.scene)
      }
      renderer?.dispose()
      renderer?.domElement.remove()
    }
  }, [url, background])

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
