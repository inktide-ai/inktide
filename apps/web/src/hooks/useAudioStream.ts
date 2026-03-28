import { useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'

interface AudioPayload {
  correlationId: string
  audioBase64: string
  contentType: string
}

/**
 * Connects to the Realtime SignalR hub and plays synthesized audio
 * as it arrives for the given platform channel ID.
 *
 * The hook manages the connection lifecycle (connect on mount,
 * disconnect on unmount, auto-reconnect on drops).
 */
export function useAudioStream(channelId: string | null | undefined) {
  // Keep a stable ref to the audio context so we don't recreate it on every render.
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (!channelId) return

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/audio')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('audioReceived', (payload: AudioPayload) => {
      playAudio(payload.audioBase64, payload.contentType, audioCtxRef)
    })

    let stopped = false

    connection
      .start()
      .then(() => {
        if (!stopped) {
          return connection.invoke('JoinChannel', channelId)
        }
      })
      .catch((err: unknown) => {
        console.error('[useAudioStream] SignalR connect failed', err)
      })

    return () => {
      stopped = true
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop()
      }
    }
  }, [channelId])
}

function playAudio(
  base64: string,
  _contentType: string,
  ctxRef: React.MutableRefObject<AudioContext | null>,
) {
  try {
    // Decode base64 → Uint8Array
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }

    // Reuse the AudioContext across clips (creating a new one per clip is wasteful
    // and browsers limit how many can exist simultaneously).
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new AudioContext()
    }
    const ctx = ctxRef.current

    ctx.decodeAudioData(bytes.buffer.slice(0)).then((buffer) => {
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start()
    }).catch((err: unknown) => {
      console.error('[useAudioStream] decodeAudioData failed', err)
    })
  } catch (err) {
    console.error('[useAudioStream] playAudio failed', err)
  }
}
