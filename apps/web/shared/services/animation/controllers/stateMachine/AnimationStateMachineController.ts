import * as THREE from 'three'
import { createVRMAnimationClip, VRMLookAtQuaternionProxy } from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '@/shared/types/IVrmController'
import { ClipRegistry } from './clipRegistry'
import * as blend from './blendEngine'
import { createAnimationActor, type AnimationActor } from './machine'
import { DEFAULT_GRAPH_CONFIG } from './defaultGraph'
import type { AnimationGraphConfig } from './types'

export class AnimationStateMachineController implements IVrmController {
  readonly id = 'animation-state-machine'

  private vrm: VRM | null = null
  private mixer: THREE.AnimationMixer | null = null
  private loader: GLTFLoader | null = null

  private readonly registry: ClipRegistry
  private readonly actor: AnimationActor

  private _disposed = false
  private _preloadAbort = new AbortController()

  private lastFadedTo: string | null = null
  private lastEmotion: string | null = null
  private activeVariation: string | null = null

  constructor(private readonly config: AnimationGraphConfig = DEFAULT_GRAPH_CONFIG) {
    this.registry = new ClipRegistry()
    this.actor = createAnimationActor(config.transitions)
  }

  // ── IVrmController ────────────────────────────────────────────────────────────

  async init({ vrm, mixer, loader }: VrmControllerSetup): Promise<void> {
    // Cancel any in-flight preload from a previous init (avatar swap).
    this._preloadAbort.abort()
    this._preloadAbort = new AbortController()
    this._disposed = false

    this.vrm    = vrm
    this.mixer  = mixer
    this.loader = loader

    // createVRMAnimationClip searches the scene for VRMLookAtQuaternionProxy by name.
    // Creating and naming it explicitly suppresses both "not found" and "name not set" warnings.
    if (vrm.lookAt) {
      const lookAtProxy = new VRMLookAtQuaternionProxy(vrm.lookAt)
      lookAtProxy.name = 'VRMLookAtQuaternionProxy'
      vrm.scene.add(lookAtProxy)
    }

    // Register all nodes before loading so getUrl() is available.
    for (const node of this.config.nodes) {
      this.registry.register(node, this.config.clipUrls[node.id])
    }

    // Idle clip must be ready before the render loop starts.
    try {
      const idleClip   = await this._loadClip('idle')
      const idleAction = mixer.clipAction(idleClip)
      idleAction.setLoop(THREE.LoopRepeat, Infinity)
      idleAction.play()
      this.registry.setAction('idle', idleAction)
      this.lastFadedTo = 'idle'
    } catch (e) {
      console.warn('[AnimSM] idle_loop.vrma load failed', e)
      return
    }

    this.actor.start()
    this.actor.send({ type: 'CLIP_READY', nodeId: 'idle' })

    // Pre-load all emote clips in the background — non-blocking.
    void this._preloadEmotes(this._preloadAbort.signal)
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    if (this._disposed || !this.mixer) return

    // 1. Advance Three.js mixer with arousal-driven tempo.
    //    In idle state: arousal drives timeScale (excited=1.6×, sleepy=0.3×).
    //    In emote/transitioning states: use 1.0 to avoid disrupting choreographed timing.
    if (ctx.soulState && this.actor.getSnapshot().value === 'idle') {
      const a = ctx.soulState.vad.a
      this.mixer.timeScale = Math.min(Math.max(0.9 + a * 0.55, 0.3), 1.6)
    } else {
      this.mixer.timeScale = 1.0
    }
    this.mixer.update(delta)

    // Suppress horizontal root motion so the character stays in place.
    // The .vrma files encode hips X/Z translation which causes world-space drift;
    // zeroing X/Z after each mixer tick keeps the character rooted while preserving
    // vertical movement (breathing, landing bounce, etc.).
    const hips = this.vrm?.humanoid.getNormalizedBoneNode('hips')
    if (hips) {
      hips.position.x = 0
      hips.position.z = 0
    }

    // 2. Sync emotion changes to XState machine.
    const incomingEmotion = ctx.emotion.emotion
    if (incomingEmotion !== this.lastEmotion) {
      if (incomingEmotion) {
        this.actor.send({ type: 'EMOTION_SET', emotion: incomingEmotion })
      } else {
        this.actor.send({ type: 'EMOTION_CLEARED' })
      }
      this.lastEmotion = incomingEmotion
    }

    // 3. Read snapshot and drive Three.js according to current state.
    const snap = this.actor.getSnapshot()

    if (snap.value !== 'idle' && this.activeVariation !== null) {
      this.activeVariation = null
    }

    switch (snap.value) {
      case 'idle':
        this._driveIdle(delta)
        break

      case 'transitioning':
        this._driveTransitioning(delta, snap.context.activeTransition)
        break

      case 'emoting':
        this._driveEmoting(snap.context.activeNodeId)
        break
    }
  }

  dispose(): void {
    if (this._disposed) return
    this._disposed = true
    this._preloadAbort.abort()
    this.actor.stop()
    if (this.mixer) blend.stopAll(this.mixer)
    this.vrm             = null
    this.mixer           = null
    this.loader          = null
    this.lastFadedTo     = null
    this.lastEmotion     = null
    this.activeVariation = null
  }

  // ── State drivers ─────────────────────────────────────────────────────────────

  private _driveIdle(delta: number): void {
    const idleAction = this.registry.getAction('idle')
    if (!idleAction) return

    // If a variation is playing, wait for near-end then crossfade back to idle.
    if (this.activeVariation) {
      const varAction = this.registry.getAction(this.activeVariation)
      if (varAction && blend.isActionNearEnd(varAction)) {
        blend.crossFadeToLooping(varAction, idleAction, 0.3)
        this.lastFadedTo = 'idle'
        this.activeVariation = null
      }
      return
    }

    // Roll for a self-transition near the end of each idle loop.
    const nearEnd = idleAction.time >= idleAction.getClip().duration - delta * 2
    if (!nearEnd) return

    for (const st of this.config.selfTransitions) {
      if (st.nodeId !== 'idle') continue
      if (Math.random() >= st.probability) continue

      const varAction = this.registry.getAction(st.variationClipId)
      if (!varAction) continue

      blend.crossFadeTo(idleAction, varAction, st.crossFadeDuration)
      this.lastFadedTo = st.variationClipId
      this.activeVariation = st.variationClipId
      this.actor.send({ type: 'IDLE_CYCLE_COMPLETE' })
      break
    }
  }

  private _driveTransitioning(
    delta: number,
    t: import('./types').InTransitionState | null,
  ): void {
    if (!t || t.paused) return

    if (t.remainingKeyframes.length > 0) {
      // ── Drive intermediate keyframe (Zira AnimationKeyframe concept) ──────────
      const kf = t.remainingKeyframes[0]
      const kfAction = this.registry.getAction(kf.clipId)
      if (kfAction && this.lastFadedTo !== kf.clipId) {
        const fromAction = this.registry.getAction(this.lastFadedTo ?? t.fromNodeId)
        blend.playKeyframe(fromAction, kfAction, kf.fadeIn)
        this.lastFadedTo = kf.clipId
      }
      if (kfAction && blend.isActionNearEnd(kfAction, 0.05)) {
        this.actor.send({ type: 'KEYFRAME_COMPLETE' })
      }
    } else {
      // ── Final cross-fade to target node ───────────────────────────────────────
      const toAction = this.registry.getAction(t.toNodeId)
      if (!toAction) return  // clip not loaded yet — wait

      if (this.lastFadedTo !== t.toNodeId) {
        const fromAction = this.registry.getAction(this.lastFadedTo ?? t.fromNodeId)
        const toNode = this.config.nodes.find((n) => n.id === t.toNodeId)

        if (fromAction) {
          if (toNode?.looping) {
            blend.crossFadeToLooping(fromAction, toAction, t.crossFadeDuration)
          } else {
            blend.crossFadeTo(fromAction, toAction, t.crossFadeDuration)
          }
        } else {
          // No source action — just play directly.
          toAction.reset()
          toAction.play()
        }
        this.lastFadedTo = t.toNodeId
      }

      // Transition is complete when the target clip has played past the crossfade window,
      // OR when the clip is near its end (guards against clip.duration < crossFadeDuration).
      if (toAction.time >= t.crossFadeDuration || blend.isActionNearEnd(toAction, 0)) {
        this.actor.send({ type: 'TRANSITION_COMPLETE' })
        this.lastFadedTo = t.toNodeId
      }
    }
  }

  private _driveEmoting(activeNodeId: string): void {
    const emoteAction = this.registry.getAction(activeNodeId)
    if (!emoteAction) return

    if (blend.isActionNearEnd(emoteAction)) {
      this.actor.send({ type: 'TRANSITION_COMPLETE' })
    }
  }

  // ── Clip loading ──────────────────────────────────────────────────────────────

  private async _loadClip(nodeId: string, signal?: AbortSignal): Promise<THREE.AnimationClip> {
    const url = this.registry.getUrl(nodeId)
    if (!url) throw new Error(`[AnimSM] no URL registered for node '${nodeId}'`)

    const gltf = await this.loader!.loadAsync(url)
    try {
      // Primary abort path: signal was aborted while load was in flight.
      signal?.throwIfAborted()
      // Belt-and-suspenders: if dispose() ran but signal wasn't aborted (shouldn't happen, but
      // vrm/mixer are null here and createVRMAnimationClip would crash without this guard).
      if (this._disposed) throw new DOMException('Controller disposed', 'AbortError')

      const anims = gltf.userData.vrmAnimations as unknown[] | undefined
      if (!anims?.length) throw new Error(`[AnimSM] no VRM animations in ${url}`)

      return createVRMAnimationClip(
        anims[0] as Parameters<typeof createVRMAnimationClip>[0],
        this.vrm!,
      )
    } finally {
      // Release GPU resources — only the AnimationClip is kept, not the GLTF scene.
      gltf.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        mesh.geometry?.dispose()
        const mats = mesh.material
          ? (Array.isArray(mesh.material) ? mesh.material : [mesh.material])
          : []
        for (const m of mats as THREE.Material[]) {
          for (const val of Object.values(m)) {
            if (val instanceof THREE.Texture) val.dispose()
          }
          m.dispose()
        }
      })
    }
  }

  private async _preloadEmotes(signal: AbortSignal): Promise<void> {
    for (const node of this.config.nodes) {
      if (node.id === 'idle' || node.looping) continue
      if (this._disposed || signal.aborted) return

      try {
        const clip = await this._loadClip(node.id, signal)
        // Re-check after the async gap: dispose() may have run while loading.
        if (this._disposed || signal.aborted) return
        const action = this.mixer!.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        this.registry.setAction(node.id, action)
      } catch (e) {
        // AbortError from signal.throwIfAborted() or the _disposed guard — expected, exit cleanly.
        if (signal.aborted || this._disposed) return
        console.warn(`[AnimSM] preload failed: ${node.id}`, e)
      }
    }
  }
}
