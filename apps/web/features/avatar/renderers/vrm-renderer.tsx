'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import type { VRM } from '@pixiv/three-vrm'
import { VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation'

import type { MouthWeights } from '@/shared/types/IVisemeProvider'
import type { EmotionState, SoulState, VrmAnimationContext } from '@/shared/types/IVrmController'
import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import { createVrmControllers } from '@/shared/services/animation/registry'

export type { LookAtMode } from '@/shared/types/IVrmController'

interface VrmRendererProps {
  url: string
  background?: string
  className?: string
  /** Called each animation frame to obtain current mouth expression weights. */
  getMouthWeights?: () => MouthWeights
  /** Called each animation frame to obtain current emotion state. */
  getEmotionState?: () => EmotionState
  /** Called each animation frame to obtain SoulState (VAD + PhysicalState). */
  getSoulState?: () => SoulState | null
  /** Hide only the VRM mesh; keep CSS / Three.js scene background. */
  modelVisible?: boolean
  /** Full renderer settings (camera, lights, model transform, look-at mode). */
  rendererSettings?: SceneRendererSettings
  baselineMood?: string
  /** Called once after the first rendered frame - canvas contains the composited image. */
  onFirstRender?: (canvas: HTMLCanvasElement) => void
  /** When set, a secondary render pass uses this portrait camera before onFirstRender fires. */
  captureCamera?: { heightRatio: number; distance: number; fov: number }
}

const SNAPSHOT_INTERVAL_MS = 30_000

function isImageUrl(bg: string): boolean {
  return bg.startsWith('http://') || bg.startsWith('https://') || bg.startsWith('blob:') || bg.startsWith('/')
}

function isTalkingFromWeights(weights: MouthWeights | null): boolean {
  if (!weights) return false
  return Math.max(weights.aa, weights.ih, weights.ou, weights.ee, weights.oh) > 0.1
}


const MAX_JAW_ANGLE = 0.32
const JAW_DEAD_ZONE = 0.10

function applyJaw(vrm: VRM, weights: MouthWeights | null): void {
  if (!weights) return
  const jawNode = vrm.humanoid.getNormalizedBoneNode('jaw')
  if (!jawNode) return
  const drive = Math.max(weights.aa, weights.oh * 0.75, weights.ou * 0.55, weights.ee * 0.40)
  const t     = drive <= JAW_DEAD_ZONE ? 0 : (drive - JAW_DEAD_ZONE) / (1 - JAW_DEAD_ZONE)
  jawNode.rotation.x = t * MAX_JAW_ANGLE
}


export default function VrmRenderer({
  url,
  background = 'transparent',
  className,
  getMouthWeights,
  getEmotionState,
  getSoulState,
  modelVisible = true,
  rendererSettings,
  baselineMood,
  onFirstRender,
  captureCamera,
}: VrmRendererProps) {
  const wrapRef               = useRef<HTMLDivElement>(null)
  const modelVisibleRef       = useRef(modelVisible)
  const getMouthWeightsRef    = useRef(getMouthWeights)
  const getEmotionStateRef    = useRef(getEmotionState)
  const getSoulStateRef       = useRef(getSoulState)
  const rendererSettingsRef   = useRef(rendererSettings)
  const baselineMoodRef       = useRef(baselineMood)
  const mousePosRef           = useRef({ x: 0, y: 0 })

  modelVisibleRef.current     = modelVisible
  getMouthWeightsRef.current  = getMouthWeights
  getEmotionStateRef.current  = getEmotionState
  getSoulStateRef.current     = getSoulState
  rendererSettingsRef.current = rendererSettings
  baselineMoodRef.current     = baselineMood

  const cameraRef         = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef       = useRef<OrbitControls | null>(null)
  const dirLightRef       = useRef<THREE.DirectionalLight | null>(null)
  const ambientRef        = useRef<THREE.AmbientLight | null>(null)
  const rendererRef       = useRef<THREE.WebGLRenderer | null>(null)
  const onFirstRenderRef  = useRef(onFirstRender)
  const firstRenderFired  = useRef(false)
  const modelHeightRef    = useRef(0)
  const captureCameraRef  = useRef(captureCamera)
  onFirstRenderRef.current = onFirstRender
  captureCameraRef.current = captureCamera

  useEffect(() => {
    firstRenderFired.current = false
  }, [url])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let camera: THREE.PerspectiveCamera | null = null
    let controls: OrbitControls | null = null
    let animationId = 0
    let initialized = false
    let disposed = false
    let startLoopFn: (() => void) | null = null  // set once VRM is ready

    const timer       = new THREE.Timer()
    const controllers = createVrmControllers(baselineMoodRef.current)
    const scene       = new THREE.Scene()

    if (background !== 'transparent' && !isImageUrl(background)) {
      scene.background = new THREE.Color(background)
    }

    const ambient = new THREE.AmbientLight(0xffffff, 1.5)
    ambientRef.current = ambient
    scene.add(ambient)

    const dir = new THREE.DirectionalLight(0xffffff, 1.0)
    dirLightRef.current = dir
    dir.position.set(1, 2, 3)
    scene.add(dir)

    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY }
    }
    document.addEventListener('mousemove', onMouseMove)

    const loader = new GLTFLoader()
    loader.register((p) => new VRMLoaderPlugin(p))
    loader.register((p) => new VRMAnimationLoaderPlugin(p))

    loader.load(
      url,
      async (gltf) => {
        const vrm = gltf.userData.vrm as VRM | undefined
        if (!vrm) return

        VRMUtils.removeUnnecessaryVertices(gltf.scene)
        VRMUtils.combineSkeletons(gltf.scene)

        const box    = new THREE.Box3().setFromObject(vrm.scene)
        const height = box.max.y - box.min.y
        const center = box.getCenter(new THREE.Vector3())
        modelHeightRef.current = height

        const pivotGroup = new THREE.Group()
        pivotGroup.position.y = -box.min.y - height * 0.1
        vrm.scene.visible = modelVisibleRef.current
        pivotGroup.add(vrm.scene)

        if (camera) {
          camera.position.set(0, height * 0.55, 2.5)
          controls?.target.set(center.x, height * 0.55, center.z)
          controls?.update()
        }

        scene.add(pivotGroup)

        const mixer = new THREE.AnimationMixer(vrm.scene)
        await Promise.all(controllers.map((c) => c.init({ vrm, mixer, loader })))

        if (disposed) return
        startLoopFn = () => runLoop(vrm)
        if (initialized) startLoopFn()
      },
      undefined,
      (err) => console.error('[VrmRenderer] load error', err),
    )

    function applyRendererSettings(rs: SceneRendererSettings, vrmScene: THREE.Group) {
      vrmScene.position.set(rs.position.posX, rs.position.posY, rs.position.posZ)
      vrmScene.rotation.y = (rs.position.rotY * Math.PI) / 180

      if (cameraRef.current && cameraRef.current.fov !== rs.camera.fov) {
        cameraRef.current.fov = rs.camera.fov
        cameraRef.current.updateProjectionMatrix()
      }

      if (controlsRef.current) {
        controlsRef.current.maxDistance = rs.camera.cameraDistance
        controlsRef.current.minDistance = rs.camera.cameraDistance * 0.2
      }

      if (dirLightRef.current) {
        dirLightRef.current.intensity = rs.directionalLight.intensity
        dirLightRef.current.color.set(rs.directionalLight.color)
        const rx = (rs.directionalLight.rotX * Math.PI) / 180
        const ry = (rs.directionalLight.rotY * Math.PI) / 180
        dirLightRef.current.position
          .set(Math.sin(ry) * Math.cos(rx), Math.sin(rx), Math.cos(ry) * Math.cos(rx))
          .normalize()
          .multiplyScalar(5)
      }

      if (ambientRef.current) {
        ambientRef.current.intensity = rs.ambientLight.intensity
        ambientRef.current.color.set(rs.ambientLight.color)
      }

      if (rendererRef.current) {
        rendererRef.current.setPixelRatio(window.devicePixelRatio * rs.camera.renderScale)
      }
    }

    function runLoop(vrm: VRM) {
      let lastSnapshotTime = -Infinity
      let settingsEverApplied = false
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        timer.update()
        const delta = timer.getDelta()
        controls?.update()

        const rs           = rendererSettingsRef.current
        const mouthWeights = getMouthWeightsRef.current?.() ?? null
        const emotionState = getEmotionStateRef.current?.() ?? { emotion: null, intensity: 0 }
        const soulState    = getSoulStateRef.current?.() ?? null

        // Apply lip-sync mouth weights directly to VRM expression manager
        if (mouthWeights && vrm.expressionManager) {
          vrm.expressionManager.setValue('aa', mouthWeights.aa)
          vrm.expressionManager.setValue('ih', mouthWeights.ih)
          vrm.expressionManager.setValue('ou', mouthWeights.ou)
          vrm.expressionManager.setValue('ee', mouthWeights.ee)
          vrm.expressionManager.setValue('oh', mouthWeights.oh)
        }

        applyJaw(vrm, mouthWeights)
        vrm.scene.visible = modelVisibleRef.current

        const ctx: VrmAnimationContext = {
          mouthWeights,
          isTalking:  isTalkingFromWeights(mouthWeights),
          emotion:    emotionState,
          camera:     camera!,
          mouse:      mousePosRef.current,
          lookAtMode:              rs?.camera?.lookAtMode               ?? 'camera',
          jiggleEnabled:           rs?.breastPhysics?.jiggleEnabled     ?? false,
          jiggleMult:              rs?.breastPhysics?.jiggleMult        ?? 1.0,
          soulState,
          randomAnimationsEnabled: rs?.animations?.randomAnimationsEnabled ?? true,
        }

        controllers.forEach((c) => c.update(delta, ctx))
        vrm.update(delta)

        if (rs) { applyRendererSettings(rs, vrm.scene); settingsEverApplied = true }
        if (rendererRef.current && camera) {
          rendererRef.current.render(scene, camera)

          const now = performance.now()
          if (now - lastSnapshotTime >= SNAPSHOT_INTERVAL_MS) {
            if (!firstRenderFired.current) {
              const cc = captureCameraRef.current
              if (cc && onFirstRenderRef.current && modelHeightRef.current > 0) {
                lastSnapshotTime = now
                firstRenderFired.current = true
                const savedPos    = camera.position.clone()
                const savedTarget = controls?.target.clone() ?? new THREE.Vector3()
                const savedFov    = camera.fov
                const savedRotY   = vrm.scene.rotation.y
                const headBone    = vrm.humanoid.getNormalizedBoneNode('head')
                const neckBone    = vrm.humanoid.getNormalizedBoneNode('neck')
                const savedHead   = headBone?.quaternion.clone()
                const savedNeck   = neckBone?.quaternion.clone()

                const h = modelHeightRef.current
                camera.position.set(0, h * cc.heightRatio, cc.distance)
                controls?.target.set(0, h * cc.heightRatio, 0)
                controls?.update()
                camera.fov = cc.fov
                camera.updateProjectionMatrix()
                // Face camera: zero body rotation and neutralize head/neck look-at
                vrm.scene.rotation.y = 0
                headBone?.quaternion.identity()
                neckBone?.quaternion.identity()
                vrm.update(0)

                rendererRef.current.render(scene, camera)
                onFirstRenderRef.current(rendererRef.current.domElement)

                camera.position.copy(savedPos)
                controls?.target.copy(savedTarget)
                controls?.update()
                camera.fov = savedFov
                camera.updateProjectionMatrix()
                vrm.scene.rotation.y = savedRotY
                if (headBone && savedHead) headBone.quaternion.copy(savedHead)
                if (neckBone && savedNeck) neckBone.quaternion.copy(savedNeck)
              } else if (settingsEverApplied) {
                lastSnapshotTime = now
                firstRenderFired.current = true
                onFirstRenderRef.current?.(rendererRef.current.domElement)
              }
              // else: renderer settings not yet applied - skip, retry next frame
            } else {
              lastSnapshotTime = now
              // Periodic update: current camera view, no portrait pass
              onFirstRenderRef.current?.(rendererRef.current.domElement)
            }
          }
        }
      }
      animate()
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (!w || !h) continue

        if (!initialized) {
          const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: background === 'transparent' || isImageUrl(background),
          })
          renderer.setPixelRatio(window.devicePixelRatio)
          renderer.setSize(w, h)
          renderer.outputColorSpace = THREE.SRGBColorSpace
          renderer.toneMapping = THREE.ACESFilmicToneMapping
          renderer.toneMappingExposure = 1.0
          wrap.appendChild(renderer.domElement)
          rendererRef.current = renderer

          camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 20)
          cameraRef.current = camera
          camera.position.set(0, 1.3, 2.5)

          controls = new OrbitControls(camera, renderer.domElement)
          controlsRef.current = controls
          controls.enableDamping = true
          controls.dampingFactor = 0.05
          controls.target.set(0, 1.3, 0)
          controls.update()

          initialized = true
          startLoopFn?.()  // start if VRM already loaded
        } else {
          rendererRef.current?.setSize(w, h)
          if (camera) {
            camera.aspect = w / h
            camera.updateProjectionMatrix()
          }
        }
      }
    })

    ro.observe(wrap)

    return () => {
      disposed = true
      cancelAnimationFrame(animationId)
      ro.disconnect()
      document.removeEventListener('mousemove', onMouseMove)
      controls?.dispose()
      controllers.forEach((c) => c.dispose())
      const rdr = rendererRef.current
      if (rdr) {
        rdr.dispose()
        rdr.domElement.remove()
      }
      cameraRef.current   = null
      controlsRef.current = null
      dirLightRef.current = null
      ambientRef.current  = null
      rendererRef.current = null
    }
  }, [url, background])

  const bgStyle = isImageUrl(background)
    ? { backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: '100%', height: '100%', ...bgStyle }}
    />
  )
}
