import type * as THREE from 'three'
import type { AnimationNode, AnimationProperty, ClipEntry } from './types'

/**
 * Maps animation node IDs to loaded Three.js AnimationActions.
 *
 * TypeScript port of Zira's AnimationProperty<T, S>:
 * evaluates the current machine context to a typed value (here: AnimationAction | null).
 */
export class ClipRegistry {
  private readonly entries = new Map<string, ClipEntry>()

  register(node: AnimationNode, url: string): void {
    this.entries.set(node.id, { nodeId: node.id, vrmaUrl: url, action: null })
  }

  setAction(nodeId: string, action: THREE.AnimationAction): void {
    const entry = this.entries.get(nodeId)
    if (entry) entry.action = action
  }

  getAction(nodeId: string): THREE.AnimationAction | null {
    return this.entries.get(nodeId)?.action ?? null
  }

  getUrl(nodeId: string): string | undefined {
    return this.entries.get(nodeId)?.vrmaUrl
  }

  hasAction(nodeId: string): boolean {
    return this.entries.get(nodeId)?.action !== null
  }

  allNodeIds(): string[] {
    return [...this.entries.keys()]
  }


  /** Returns the active node's action. Equivalent to AnimationProperty<THREE.AnimationAction | null>. */
  readonly activeAction: AnimationProperty<THREE.AnimationAction | null> =
    (ctx) => this.getAction(ctx.activeNodeId)

  /** Returns the active node's VRMA URL. */
  readonly activeClipUrl: AnimationProperty<string | null> =
    (ctx) => this.getUrl(ctx.activeNodeId) ?? null
}
