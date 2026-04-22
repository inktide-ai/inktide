import * as THREE from 'three'
import { createVRMAnimationClip } from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import type { IVrmController, VrmAnimationContext, VrmControllerSetup } from '../../../../ports/IVrmController'
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

  // Tracks which nodeId was last passed to Three.js blend calls to avoid redundant fades.
  private lastFadedTo: string | null = null
  // Tracks emotion seen last frame to diff-send events.
  private lastEmotion: string | null = null

  constructor(private readonly config: AnimationGraphConfig = DEFAULT_GRAPH_CONFIG) {
    this.registry = new ClipRegistry()
    this.actor = createAnimationActor(config.transitions)
  }

  // ── IVrmController ────────────────────────────────────────────────────────────

  async init({ vrm, mixer, loader }: VrmControllerSetup): Promise<void> {
    this.vrm    = vrm
    this.mixer  = mixer
    this.loader = loader

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
    void this._preloadEmotes()
  }

  update(delta: number, ctx: VrmAnimationContext): void {
    if (!this.mixer) return

    // 1. Advance Three.js mixer every frame regardless of state.
    this.mixer.update(delta)

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
    this.actor.stop()
    if (this.mixer) blend.stopAll(this.mixer)
    this.vrm    = null
    this.mixer  = null
    this.loader = null
    this.lastFadedTo  = null
    this.lastEmotion  = null
  }

  // ── State drivers ─────────────────────────────────────────────────────────────

  private _driveIdle(delta: number): void {
    const idleAction = this.registry.getAction('idle')
    if (!idleAction) return

    // SelfTransition: roll probability die near end of idle cycle.
    for (const st of this.config.selfTransitions) {
      if (st.nodeId !== 'idle') continue
      const nearEnd = idleAction.time >= idleAction.getClip().duration - delta * 2
      if (nearEnd && Math.random() < st.probability) {
        this.actor.send({ type: 'IDLE_CYCLE_COMPLETE' })
        // Variation clip playback handled in next update when state re-enters idle.
      }
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

      // Advance elapsed and signal completion.
      // We track elapsed via Three.js toAction.time vs crossFadeDuration.
      if (toAction.time >= t.crossFadeDuration) {
        this.actor.send({ type: 'TRANSITION_COMPLETE' })
        this.lastFadedTo = t.toNodeId
      }
    }

    // Advance transition elapsed in context each frame.
    // We do this by checking if we've exceeded totalDuration.
    const elapsed = (t.elapsed ?? 0) + delta
    if (elapsed >= t.totalDuration) {
      this.actor.send({ type: 'TRANSITION_COMPLETE' })
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

  private async _loadClip(nodeId: string): Promise<THREE.AnimationClip> {
    const url = this.registry.getUrl(nodeId)
    if (!url) throw new Error(`[AnimSM] no URL registered for node '${nodeId}'`)

    const gltf  = await this.loader!.loadAsync(url)
    const anims = gltf.userData.vrmAnimations as unknown[] | undefined
    if (!anims?.length) throw new Error(`[AnimSM] no VRM animations in ${url}`)

    return createVRMAnimationClip(
      anims[0] as Parameters<typeof createVRMAnimationClip>[0],
      this.vrm!,
    )
  }

  private async _preloadEmotes(): Promise<void> {
    for (const node of this.config.nodes) {
      if (node.id === 'idle' || node.looping) continue
      if (!this.mixer) return

      try {
        const clip   = await this._loadClip(node.id)
        const action = this.mixer.clipAction(clip)
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
        this.registry.setAction(node.id, action)
      } catch (e) {
        console.warn(`[AnimSM] preload failed: ${node.id}`, e)
      }
    }
  }
}
