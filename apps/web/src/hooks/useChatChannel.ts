import { useCallback, useEffect, useRef, useState } from 'react'
import { HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr'
import { apiFetch } from '../api/client'
import type { LipSyncHandle, VisemeCue } from './useLipSync'

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
}

/** Per-correlation accumulation state for deduplication. */
interface ChunkBuffer {
  messageId: string
  lastSeq: number
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Manages a SignalR connection to the AudioHub for a chimera-chat channel,
 * accumulates LLM text chunks with sequenceNumber-based dedup, and routes
 * audio chunks through the shared lipSync audio graph.
 *
 * `channelId` must be `"{cardId}:{userId}"` — the composite key used by the
 * backend to isolate per-user SignalR groups.
 */
export function useChatChannel(
  channelId: string | null,
  lipSync?: LipSyncHandle,
): UseChatChannelResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connected, setConnected] = useState(false)

  // correlationId → { messageId, lastSeq }
  const chunkBuffers = useRef<Map<string, ChunkBuffer>>(new Map())
  const audioPlayerRef = useRef<MiniAudioPlayer | null>(null)

  // Keep a stable ref to the latest messages for use inside callbacks
  // without re-subscribing SignalR handlers on every render.
  const messagesRef = useRef<ChatMessage[]>(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  // Keep a stable ref to lipSync so audio callbacks always use the current handle.
  const lipSyncRef = useRef<LipSyncHandle | undefined>(lipSync)
  useEffect(() => { lipSyncRef.current = lipSync }, [lipSync])

  useEffect(() => {
    if (!channelId) return

    const player = new MiniAudioPlayer(() => lipSyncRef.current)
    audioPlayerRef.current = player

    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/audio')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build()

    connection.on('textChunk', (event: TextChunkEvent) => {
      const buffers = chunkBuffers.current
      let buf = buffers.get(event.correlationId)

      if (!buf) {
        // First chunk for this correlation — bind to the oldest unbound pending assistant message.
        const target = messagesRef.current.find(
          (m) => m.role === 'assistant' && m.pending && !m.correlationId,
        )

        if (!target) {
          // Race: textChunk arrived before the 202 state update. Create a new message.
          const newId = crypto.randomUUID()
          setMessages((prev) => [
            ...prev,
            { id: newId, role: 'assistant', content: '', pending: true, correlationId: event.correlationId },
          ])
          buf = { messageId: newId, lastSeq: -1 }
        } else {
          // Bind the pending slot to this correlationId.
          setMessages((prev) =>
            prev.map((m) => m.id === target.id ? { ...m, correlationId: event.correlationId } : m),
          )
          buf = { messageId: target.id, lastSeq: -1 }
        }
        buffers.set(event.correlationId, buf)
      }

      // Dedup: Redis XAUTOCLAIM can re-deliver already-processed entries.
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

      if (event.isLast) {
        buffers.delete(event.correlationId)
      }
    })

    connection.on('audioReceived', (event: AudioReceivedEvent) => {
      player.enqueue(event.correlationId, event.audioBase64, event.visemeTimeline ?? null)
    })

    connection.onreconnected(() => {
      // Group membership is lost on reconnect — must rejoin explicitly.
      connection.invoke('JoinChannel', channelId).catch(() => {})
      setConnected(true)
    })

    connection.onclose(() => setConnected(false))

    let stopped = false
    connection
      .start()
      .then(() => {
        if (stopped) return
        setConnected(true)
        return connection.invoke('JoinChannel', channelId)
      })
      .catch((err: unknown) => {
        console.error('[useChatChannel] SignalR connect failed', err)
      })

    return () => {
      stopped = true
      player.destroy()
      audioPlayerRef.current = null
      chunkBuffers.current.clear()
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop()
      }
    }
  }, [channelId])

  const send = useCallback(
    async (text: string) => {
      if (!channelId || !text.trim()) return

      const userMsgId = crypto.randomUUID()
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

        // Message accepted — mark sent and add pending assistant slot.
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
      // Remove the failed message and re-send.
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
      send(msg.content)
    },
    [send],
  )

  return { messages, send, retry, connected }
}

// ── MiniAudioPlayer ───────────────────────────────────────────────────────────
//
// Lightweight sequential audio player that routes through the shared lipSync
// audio graph when available. Mirrors the AudioPlayer in useAudioStream but
// receives the lipSync handle via a getter to handle the ref update pattern.

interface QueueItem {
  base64: string
  timeline: VisemeCue[] | null
}

class MiniAudioPlayer {
  private readonly _getLipSync: () => LipSyncHandle | undefined
  private _ctx: AudioContext | null = null

  private _queue: QueueItem[] = []
  private _correlationId: string | null = null
  private _activeSource: AudioBufferSourceNode | null = null
  private _playing = false
  private _destroyed = false

  constructor(getLipSync: () => LipSyncHandle | undefined) {
    this._getLipSync = getLipSync
  }

  enqueue(correlationId: string, base64: string, timeline: VisemeCue[] | null) {
    if (this._destroyed) return

    if (correlationId !== this._correlationId) {
      this._flush()
      this._correlationId = correlationId
    }

    this._queue.push({ base64, timeline })
    if (!this._playing) this._drain()
  }

  destroy() {
    this._destroyed = true
    this._flush()
    // Only close AudioContext if we own it (lipSync is absent).
    if (!this._getLipSync() && this._ctx) {
      this._ctx.close().catch(() => {})
    }
  }

  private _getCtx(): AudioContext {
    const lipSync = this._getLipSync()
    if (lipSync) return lipSync.getAudioContext()
    if (!this._ctx || this._ctx.state === 'closed') {
      this._ctx = new AudioContext()
    }
    return this._ctx
  }

  private _flush() {
    this._queue = []
    if (this._activeSource) {
      try {
        this._activeSource.onended = null
        this._activeSource.stop()
      } catch { /* already stopped */ }
      this._activeSource = null
    }
    this._playing = false
    this._getLipSync()?.setVisemeTimeline(null, 0)
  }

  private _drain() {
    if (this._destroyed) return
    const item = this._queue.shift()
    if (!item) { this._playing = false; return }
    this._playing = true
    this._play(item)
  }

  private _play(item: QueueItem) {
    const ctx = this._getCtx()
    const lipSync = this._getLipSync()

    const bytes = base64ToBytes(item.base64)
    ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer)
      .then((buffer) => {
        if (this._destroyed || !this._playing) return

        const destination = lipSync ? lipSync.getAnalyserNode() : ctx.destination
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(destination)
        source.onended = () => {
          if (this._activeSource === source) this._activeSource = null
          this._drain()
        }
        this._activeSource = source

        const startT = ctx.currentTime
        source.start()

        if (item.timeline && lipSync) {
          lipSync.setVisemeTimeline(item.timeline, startT)
        }
      })
      .catch((err: unknown) => {
        console.error('[useChatChannel] decodeAudioData failed', err)
        this._activeSource = null
        this._drain()
      })
  }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}
