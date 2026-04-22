import { useCallback, useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { IAudioPlayer } from '../ports/IAudioPlayer'
import type { VisemeCue } from '../ports/IVisemeProvider'
import { WebAudioPlayer } from '../services/audio/WebAudioPlayer'
import type { LipSyncHandle } from './useLipSync'
import type { EmotionState } from '../ports/IVrmController'

interface AudioPayload {
  correlationId: string
  audioBase64: string
  contentType: string
  visemeTimeline?: VisemeCue[]
  emotion?: string
  emotionIntensity?: number
}

export interface UseAudioStreamOptions {
  lipSync?: LipSyncHandle
}

export interface UseAudioStreamResult {
  /** Stable getter — read current emotion state each animation frame. */
  getEmotionState: () => EmotionState
}

/**
 * LSP: использует IAudioPlayer вместо конкретного AudioPlayer.
 * SRP: только SignalR-соединение + диспетчеризация аудио на IAudioPlayer.
 *
 * AudioPlayer (был) и MiniAudioPlayer (был в useChatChannel) — удалены.
 * WebAudioPlayer реализует IAudioPlayer и заменяет оба класса.
 */
export function useAudioStream(
  channelId: string | null | undefined,
  options: UseAudioStreamOptions = {},
): UseAudioStreamResult {
  const { lipSync } = options

  // Держим lipSync в ref — WebAudioPlayer читает через getter, не пересоздаётся при изменении
  const lipSyncRef = useRef<LipSyncHandle | undefined>(lipSync)
  useEffect(() => { lipSyncRef.current = lipSync }, [lipSync])

  const emotionRef   = useRef<EmotionState>({ emotion: null, intensity: 0 })
  const emotionReset = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!channelId) return

    // DIP: создаём через IAudioPlayer — конкретный класс подменяем без изменения хука
    const player: IAudioPlayer = new WebAudioPlayer(() => lipSyncRef.current)

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/audio')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('audioReceived', (payload: AudioPayload) => {
      player.enqueue(payload.correlationId, payload.audioBase64, payload.visemeTimeline ?? null)

      if (payload.emotion) {
        if (emotionReset.current) clearTimeout(emotionReset.current)
        emotionRef.current = { emotion: payload.emotion, intensity: payload.emotionIntensity ?? 0.8 }
        emotionReset.current = setTimeout(() => {
          emotionRef.current = { emotion: null, intensity: 0 }
        }, 5_000)
      }
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
      if (emotionReset.current) clearTimeout(emotionReset.current)
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop()
      }
    }
  }, [channelId]) // lipSync намеренно убран: WebAudioPlayer читает через getter

  // Stable getter — reads from ref, safe to call every animation frame
  const getEmotionState = useCallback((): EmotionState => emotionRef.current, [])

  return { getEmotionState }
}
