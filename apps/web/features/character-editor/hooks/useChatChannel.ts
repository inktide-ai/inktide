'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { apiFetch } from '@/api/client'
import type { IAudioPlayer } from '@/shared/types/IAudioPlayer'
import type { VisemeCue } from '@/shared/types/IVisemeProvider'
import { WebAudioPlayer } from '@/shared/services/audio/WebAudioPlayer'
import type { LipSyncHandle } from '@/shared/hooks/useLipSync'
import type { EmotionState } from '@/shared/types/IVrmController'
import { useAuth } from '@/shared/services/auth'
import { getFreshAuthToken } from '@/api/client'

// ── Public types ──────────────────────────────────────────────────────────────

export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Assistant message is still accumulating text chunks. */
  pending: boolean
  /** User message send state. */
  status?: MessageStatus
  /** Internal: correlationId bound on first textChunk (assistant only). */
  correlationId?: string
}

export interface UseChatChannelResult {
  messages: ChatMessage[]
  send: (text: string) => Promise<void>
  retry: (messageId: string) => void
  connected: boolean
  /** Stable getter — read current emotion state each animation frame. */
  getEmotionState: () => EmotionState
}

// ── Internal types ─────────────────────────────────────────────────────────────

interface TextChunkEvent {
  correlationId: string
  text: string
  sequenceNumber: number
  isLast: boolean
}

interface AudioReceivedEvent {
  correlationId: string
  audioBase64: string
  contentType: string
  visemeTimeline?: VisemeCue[]
  emotion?: string
  emotionIntensity?: number
}

interface ChunkBuffer {
  messageId: string
  lastSeq: number
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * LSP: использует IAudioPlayer вместо конкретного MiniAudioPlayer.
 * SRP: только SignalR-соединение + накопление текста + диспетчеризация аудио.
 *      Аудиовоспроизведение делегировано WebAudioPlayer через IAudioPlayer.
 */
export function useChatChannel(
  channelId: string | null,
  lipSync?: LipSyncHandle,
): UseChatChannelResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)
  const { isLoggedIn, isInitialized } = useAuth()

  const chunkBuffers = useRef<Map<string, ChunkBuffer>>(new Map())

  const emotionRef     = useRef<EmotionState>({ emotion: null, intensity: 0 })
  const emotionReset   = useRef<ReturnType<typeof setTimeout> | null>(null)

  // LSP: тип IAudioPlayer — конкретный класс можно заменить без изменения хука
  const playerRef = useRef<IAudioPlayer | null>(null)

  const messagesRef = useRef<ChatMessage[]>(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  // Getter-функция позволяет WebAudioPlayer читать актуальный lipSync через ref
  const lipSyncRef = useRef<LipSyncHandle | undefined>(lipSync)
  useEffect(() => { lipSyncRef.current = lipSync }, [lipSync])

  useEffect(() => {
    if (!channelId || !isInitialized || !isLoggedIn) return

    // DIP: создаём через интерфейс — можно подменить реализацию
    const player: IAudioPlayer = new WebAudioPlayer(() => lipSyncRef.current)
    playerRef.current = player

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/audio', { accessTokenFactory: getFreshAuthToken })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('textChunk', (event: TextChunkEvent) => {
      const buffers = chunkBuffers.current
      let buf = buffers.get(event.correlationId)

      if (!buf) {
        const target = messagesRef.current.find(
          (m) => m.role === 'assistant' && m.pending && !m.correlationId,
        )

        if (!target) {
          const newId = crypto.randomUUID()
          setMessages((prev) => [
            ...prev,
            { id: newId, role: 'assistant', content: '', pending: true, correlationId: event.correlationId },
          ])
          buf = { messageId: newId, lastSeq: -1 }
        } else {
          setMessages((prev) =>
            prev.map((m) => m.id === target.id ? { ...m, correlationId: event.correlationId } : m),
          )
          buf = { messageId: target.id, lastSeq: -1 }
        }
        buffers.set(event.correlationId, buf)
      }

      // Dedup: Redis XAUTOCLAIM может повторно доставить уже обработанные записи
      if (event.sequenceNumber <= buf.lastSeq) return
      buf.lastSeq = event.sequenceNumber

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== buf!.messageId) return m
          const next = { ...m, content: m.content + event.text }
          if (event.isLast) {
            next.pending = false
            next.correlationId = undefined
          }
          return next
        }),
      )

      if (event.isLast) buffers.delete(event.correlationId)
    })

    connection.on('audioReceived', (event: AudioReceivedEvent) => {
      // LSP: player — IAudioPlayer, конкретный класс прозрачно заменяем
      player.enqueue(event.correlationId, event.audioBase64, event.visemeTimeline ?? null)

      console.debug('[audioReceived] emotion=%s intensity=%s', event.emotion ?? 'null', event.emotionIntensity ?? 'null')

      if (event.emotion) {
        if (emotionReset.current) clearTimeout(emotionReset.current)
        emotionRef.current = { emotion: event.emotion, intensity: event.emotionIntensity ?? 0.8 }
        emotionReset.current = setTimeout(() => {
          emotionRef.current = { emotion: null, intensity: 0 }
        }, 5_000)
      }
    })

    connection.onreconnected(() => {
      connection.invoke('JoinChannel', channelId).catch(() => {})
      setConnected(true)
    })

    connection.onclose(() => setConnected(false))

    let stopped = false
    connection
      .start()
      .then(() => {
        if (stopped) { connection.stop().catch(() => {}); return }
        setConnected(true)
        return connection.invoke('JoinChannel', channelId)
      })
      .catch((err: unknown) => {
        if (!stopped) console.error('[useChatChannel] SignalR connect failed', err)
      })

    return () => {
      stopped = true
      player.destroy()
      playerRef.current = null
      chunkBuffers.current.clear()
      if (emotionReset.current) clearTimeout(emotionReset.current)
      // Don't stop while still connecting — causes "stopped during negotiation" in StrictMode
      if (
        connection.state === HubConnectionState.Connected ||
        connection.state === HubConnectionState.Reconnecting
      ) {
        connection.stop().catch(() => {})
      }
    }
  }, [channelId, isLoggedIn, isInitialized])

  const send = useCallback(
    async (text: string) => {
      if (!channelId || !text.trim()) return

      const userMsgId      = crypto.randomUUID()
      const assistantMsgId = crypto.randomUUID()

      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: text, pending: false, status: 'sending' as const },
      ])

      try {
        const res = await apiFetch('/api/connector/chat/send', {
          method: 'POST',
          body: JSON.stringify({ channelId, text }),
        })

        if (!res.ok) {
          setMessages((prev) =>
            prev.map((m): ChatMessage => m.id === userMsgId ? { ...m, status: 'failed' } : m),
          )
          return
        }

        setMessages((prev): ChatMessage[] => [
          ...prev.map((m): ChatMessage => m.id === userMsgId ? { ...m, status: 'sent' } : m),
          { id: assistantMsgId, role: 'assistant', content: '', pending: true },
        ])
      } catch {
        setMessages((prev) =>
          prev.map((m): ChatMessage => m.id === userMsgId ? { ...m, status: 'failed' } : m),
        )
      }
    },
    [channelId],
  )

  const retry = useCallback(
    (messageId: string) => {
      const msg = messagesRef.current.find((m) => m.id === messageId)
      if (!msg || msg.role !== 'user' || msg.status !== 'failed') return
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      send(msg.content)
    },
    [send],
  )

  // Stable getter — reads from ref, safe to call every animation frame
  const getEmotionState = useCallback((): EmotionState => emotionRef.current, [])

  return { messages, send, retry, connected, getEmotionState }
}
