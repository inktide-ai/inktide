'use client'
import { useCallback, useEffect, useRef } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import type { IAudioPlayer } from '@/shared/types/IAudioPlayer'
import type { VisemeCue } from '@/shared/types/IVisemeProvider'
import { WebAudioPlayer } from '../services/audio/WebAudioPlayer'
import type { LipSyncHandle } from './useLipSync'
import type { EmotionState, SoulState } from '@/shared/types/IVrmController'
import { useAuth } from '@/shared/services/auth'
import { getFreshAuthToken } from '@/api/client'

interface AudioPayload {
  correlationId: string
  audioBase64: string
  contentType: string
  visemeTimeline?: VisemeCue[]
  emotion?: string
  emotionIntensity?: number
  vad?: { v: number; a: number; d: number }
  physical?: { energy: number; attention: number; comfort: number }
}

export interface UseAudioStreamOptions {
  lipSync?: LipSyncHandle
}

export interface UseAudioStreamResult {
  /** Stable getter — read current emotion state each animation frame. */
  getEmotionState: () => EmotionState
  /** Stable getter — read current SoulState each animation frame. Null until first audio event. */
  getSoulState: () => SoulState | null
}

/**
 * LSP: использует IAudioPlayer вместо конкретного AudioPlayer.
 * SRP: только SignalR-соединение + диспетчеризация аудио на IAudioPlayer.
 */
export function useAudioStream(
  channelId: string | null | undefined,
  options: UseAudioStreamOptions = {},
): UseAudioStreamResult {
  const { lipSync } = options
  const { isLoggedIn, isInitialized } = useAuth()

  const lipSyncRef = useRef<LipSyncHandle | undefined>(lipSync)
  useEffect(() => { lipSyncRef.current = lipSync }, [lipSync])

  const emotionRef    = useRef<EmotionState>({ emotion: null, intensity: 0 })
  const emotionReset  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const soulStateRef  = useRef<SoulState | null>(null)
  const generationRef = useRef(0)

  useEffect(() => {
    if (!channelId || !isInitialized || !isLoggedIn) return

    const generation = ++generationRef.current
    emotionRef.current   = { emotion: null, intensity: 0 }
    soulStateRef.current = null
    if (emotionReset.current) { clearTimeout(emotionReset.current); emotionReset.current = null }

    const player: IAudioPlayer = new WebAudioPlayer(() => lipSyncRef.current)

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/audio', { accessTokenFactory: getFreshAuthToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('audioReceived', (payload: AudioPayload) => {
      player.enqueue(payload.correlationId, payload.audioBase64, payload.visemeTimeline ?? null)

      if (generation !== generationRef.current) return

      if (payload.emotion) {
        if (emotionReset.current) clearTimeout(emotionReset.current)
        emotionRef.current = { emotion: payload.emotion, intensity: payload.emotionIntensity ?? 0.8 }
        emotionReset.current = setTimeout(() => {
          emotionRef.current = { emotion: null, intensity: 0 }
        }, 5_000)
      }

      // Update SoulState whenever we have VAD data
      if (payload.vad) {
        soulStateRef.current = {
          vad: payload.vad,
          physical: payload.physical ?? { energy: 1, attention: 0, comfort: 0.5 },
        }
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
  }, [channelId, isLoggedIn, isInitialized])

  const getEmotionState = useCallback((): EmotionState => emotionRef.current, [])
  const getSoulState    = useCallback((): SoulState | null => soulStateRef.current, [])

  return { getEmotionState, getSoulState }
}
