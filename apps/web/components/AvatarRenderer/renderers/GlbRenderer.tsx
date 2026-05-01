'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

function fitCameraToModel(
  cam: THREE.PerspectiveCamera,
  ctrl: OrbitControls,
  root: THREE.Object3D,
): void {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(root)
  if (box.isEmpty()) {
    cam.position.set(0, 1, 3)
    ctrl.target.set(0, 1, 0)
    cam.near = 0.01
    cam.far = 1000
    cam.updateProjectionMatrix()
    ctrl.update()
    return
  }

  const center = box.getCenter(new THREE.Vector3())
  const sphere = box.getBoundingSphere(new THREE.Sphere())
  const radius = Math.max(sphere.radius, 1e-4)
  const distance = radius * 2.8

  cam.near = Math.max(radius / 2000, 0.001)
  cam.far = Math.max(distance * 50, radius * 100, 1000)

  cam.position.copy(center)
  cam.position.y += radius * 0.35
  cam.position.z += distance

  ctrl.target.copy(center)
  cam.updateProjectionMatrix()
  ctrl.update()
}

interface GlbRendererProps {
  url: string
  background?: string
  className?: string
  modelVisible?: boolean
}

export default function GlbRenderer({
  url,
  background = 'transparent',
  className,
  modelVisible = true,
}: GlbRendererProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const modelRootRef = useRef<THREE.Group | null>(null)
  const modelVisibleRef = useRef(modelVisible)
  modelVisibleRef.current = modelVisible

  useEffect(() => {
    const root = modelRootRef.current
    if (root) root.visible = modelVisible
  }, [modelVisible])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let renderer: THREE.WebGLRenderer | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let controls: OrbitControls | null = null
    let animationId: number
    let loadedScene: THREE.Group | null = null
    let initialized = false

    const scene = new THREE.Scene()
    if (background !== 'transparent') scene.background = new THREE.Color(background)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(1, 2, 3)
    scene.add(dir)

    // Load model independently — will be added to scene once renderer is ready
    const loader = new GLTFLoader()
    let modelReady = false

    loader.load(
      url,
      (gltf) => {
        loadedScene = gltf.scene

        if (camera && controls) {
          fitCameraToModel(camera, controls, loadedScene)
        }

        scene.add(loadedScene)
        modelRootRef.current = loadedScene
        loadedScene.visible = modelVisibleRef.current
        modelReady = true

        if (initialized) startLoop()
      },
      undefined,
      (err) => console.error('[GlbRenderer] load error', err),
    )

    function startLoop() {
      const animate = () => {
        animationId = requestAnimationFrame(animate)
        controls?.update()
        if (renderer && camera) renderer.render(scene, camera)
      }
      animate()
    }

    // Initialize renderer only once we know the real container size
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (!w || !h) continue

        if (!initialized) {
          // First time we have real dimensions — create renderer
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: background === 'transparent' })
          renderer.setPixelRatio(window.devicePixelRatio)
          renderer.setSize(w, h)
          renderer.outputColorSpace = THREE.SRGBColorSpace
          wrap.appendChild(renderer.domElement)

          camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100000)
          camera.position.set(0, 1, 3)

          controls = new OrbitControls(camera, renderer.domElement)
          controls.enableDamping = true
          controls.dampingFactor = 0.05
          controls.target.set(0, 1, 0)

          // If model already loaded, position camera
          if (loadedScene) {
            fitCameraToModel(camera, controls, loadedScene)
          }

          initialized = true
          if (modelReady) startLoop()
        } else {
          // Container resized — update renderer and camera
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
      modelRootRef.current = null
      controls?.dispose()
      if (loadedScene) {
        loadedScene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose()
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
            else obj.material?.dispose()
          }
        })
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
