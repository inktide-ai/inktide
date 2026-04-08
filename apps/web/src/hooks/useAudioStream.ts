import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { LipSyncHandle, VisemeCue } from './useLipSync'

interface AudioPayload {
  correlationId: string
  audioBase64: string
  contentType: string
  /** Rhubarb viseme timeline — present when the backend has `rhubarb` in PATH. */
  visemeTimeline?: VisemeCue[]
}

export interface UseAudioStreamOptions {
  /**
   * When provided, audio is routed through the LipSync AnalyserNode so that
   * frequency data is available for mouth animation.  Without it, audio plays
   * directly and no lipsync is driven.
   */
  lipSync?: LipSyncHandle
}

/**
 * Connects to the Realtime SignalR hub and plays synthesized audio
 * as it arrives for the given platform channel ID.
 *
 * Audio chunks are queued and played sequentially. When a new correlationId
 * arrives (new LLM response), the current queue is flushed and the active
 * source is stopped immediately.
 *
 * When `lipSync` is supplied the audio graph becomes:
 *   BufferSource → AnalyserNode → AudioContext.destination
 *
 * Lip sync mode is selected automatically:
 *  - If the payload contains a `visemeTimeline`, `lipSync.setVisemeTimeline()` is
 *    called the moment `source.start()` fires — giving phoneme-accurate sync.
 *  - Otherwise the existing real-time formant analysis runs as fallback.
 */
export function useAudioStream(
  channelId: string | null | undefined,
  options: UseAudioStreamOptions = {},
) {
  const { lipSync } = options
  const playerRef = useRef<AudioPlayer | null>(null)

  useEffect(() => {
    if (!channelId) return

    const player = new AudioPlayer(lipSync)
    playerRef.current = player

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/audio')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('audioReceived', (payload: AudioPayload) => {
      player.enqueue(payload.correlationId, payload.audioBase64, payload.visemeTimeline ?? null)
    })

    let stopped = false

    connection
      .start()
      .then(() => {
        if (!stopped) return connection.invoke('JoinChannel', channelId)
      })
      .catch((err: unknown) => {
        console.error('[useAudioStream] SignalR connect failed', err)
      })

    return () => {
      stopped = true
      player.destroy()
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop()
      }
    }
  }, [channelId, lipSync])
}

// ── AudioPlayer ───────────────────────────────────────────────────────────────

interface QueueItem {
  base64: string
  timeline: VisemeCue[] | null
}

/**
 * Manages a sequential audio playback queue with per-correlation flushing.
 *
 * - One shared AudioContext for the lifetime of the player.
 * - New correlationId → flush queue + stop current source immediately.
 * - Chunks within the same correlation play back-to-back without gaps.
 * - When a viseme timeline is present, calls `lipSync.setVisemeTimeline()`
 *   exactly when `source.start()` fires so timing is accurate.
 */
class AudioPlayer {
  private readonly _lipSync: LipSyncHandle | undefined
  private readonly _ctx: AudioContext

  private _queue: QueueItem[] = []
  private _currentCorrelationId: string | null = null
  private _activeSource: AudioBufferSourceNode | null = null
  private _playing = false
  private _destroyed = false

  constructor(lipSync: LipSyncHandle | undefined) {
    this._lipSync = lipSync
    this._ctx = lipSync ? lipSync.getAudioContext() : new AudioContext()
  }

  enqueue(correlationId: string, base64: string, timeline: VisemeCue[] | null) {
    if (this._destroyed) return

    if (correlationId !== this._currentCorrelationId) {
      // New LLM response — discard stale audio and clear active timeline
      this._flush()
      this._currentCorrelationId = correlationId
    }

    this._queue.push({ base64, timeline })
    if (!this._playing) this._drain()
  }

  destroy() {
    this._destroyed = true
    this._flush()
    if (!this._lipSync) {
      this._ctx.close().catch(() => {})
    }
  }

  private _flush() {
    this._queue = []
    if (this._activeSource) {
      try {
        this._activeSource.onended = null
        this._activeSource.stop()
      } catch {
        // already stopped
      }
      this._activeSource = null
    }
    this._playing = false
    // Clear any active timeline so the avatar returns to rest
    this._lipSync?.setVisemeTimeline(null, 0)
  }

  private _drain() {
    if (this._destroyed) return
    const item = this._queue.shift()
    if (!item) {
      this._playing = false
      return
    }
    this._playing = true
    this._play(item)
  }

  private _play(item: QueueItem) {
    try {
      const bytes = base64ToBytes(item.base64)
      this._ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer)
        .then((buffer) => {
          if (this._destroyed || !this._playing) return

          const destination = this._lipSync
            ? this._lipSync.getAnalyserNode()
            : this._ctx.destination

          const source = this._ctx.createBufferSource()
          source.buffer = buffer
          source.connect(destination)
          source.onended = () => {
            if (this._activeSource === source) {
              this._activeSource = null
            }
            this._drain()
          }
          this._activeSource = source

          // Record AudioContext time before start() so timeline is precisely synced
          const startT = this._ctx.currentTime
          source.start()

          // Activate timeline mode — must happen after start() to get the correct startT
          if (item.timeline && this._lipSync) {
            this._lipSync.setVisemeTimeline(item.timeline, startT)
          }
        })
        .catch((err: unknown) => {
          console.error('[useAudioStream] decodeAudioData failed', err)
          this._activeSource = null
          this._drain()
        })
    } catch (err) {
      console.error('[useAudioStream] playAudio failed', err)
      this._activeSource = null
      this._drain()
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
