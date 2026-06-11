import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'

export const RENDERER_BRIDGE_CHANNEL = 'INKTIDE_RENDERER_UPDATE' as const

export interface RendererBridgeMessage {
  type: typeof RENDERER_BRIDGE_CHANNEL
  settings: SceneRendererSettings
}

export function sendRendererUpdate(iframe: HTMLIFrameElement, settings: SceneRendererSettings): void {
  iframe.contentWindow?.postMessage(
    { type: RENDERER_BRIDGE_CHANNEL, settings } satisfies RendererBridgeMessage,
    window.location.origin,
  )
}

export function isRendererBridgeMessage(data: unknown): data is RendererBridgeMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>).type === RENDERER_BRIDGE_CHANNEL &&
    typeof (data as Record<string, unknown>).settings === 'object'
  )
}
