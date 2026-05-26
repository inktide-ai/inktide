'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch, ApiError } from '../api/client'

export type SynthState = 'idle' | 'loading' | 'playing' | 'streaming' | 'error'

export interface TtsSynthRequest {
  text: string
  voiceId: string
  speed: number
  audioFormat: 'mp3' | 'wav' | 'opus'
  stream: boolean
  providerId: string
  apiKey?: string
  /** Provider-specific parameters forwarded verbatim (e.g. stability, style for ElevenLabs). */
  providerParams?: Record<string, unknown>
}

export interface ChunkMeta {
  index: number
  byteLength: number
  receivedAt: number
}

export interface UseTtsSynthReturn {
  state: SynthState
  audioUrl: string | null
  error: string | null
  chunks: ChunkMeta[]
  synthesize: (req: TtsSynthRequest) => Promise<void>
  streamChunked: (req: TtsSynthRequest) => Promise<void>
  reset: () => void
}

function buildHeaders(apiKey?: string): Record<string, string> {
  const h: Record<string, string> = {}
  if (apiKey) h['X-TTS-Api-Key'] = apiKey
  return h
}

function contentTypeForFormat(format: string): string {
  switch (format) {
    case 'wav': return 'audio/wav'
    case 'opus': return 'audio/opus'
    default: return 'audio/mpeg'
  }
}

export function useTtsSynth(): UseTtsSynthReturn {
  const [state, setState] = useState<SynthState>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chunks, setChunks] = useState<ChunkMeta[]>([])

  // Track previous blob URL so we can revoke it when replacing
  const prevUrlRef = useRef<string | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)

  // Revoke URL and cancel any in-flight stream on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current)
      streamAbortRef.current?.abort()
    }
  }, [])

  const setNewUrl = useCallback((url: string | null) => {
    if (prevUrlRef.current) {
      URL.revokeObjectURL(prevUrlRef.current)
    }
    prevUrlRef.current = url
    setAudioUrl(url)
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setError(null)
    setChunks([])
    setNewUrl(null)
  }, [setNewUrl])

  const synthesize = useCallback(async (req: TtsSynthRequest) => {
    setState('loading')
    setError(null)
    setChunks([])
    setNewUrl(null)

    try {
      const res = await apiFetch('/api/v1/tts/synthesize', {
        method: 'POST',
        headers: buildHeaders(req.apiKey),
        body: JSON.stringify({
          text: req.text,
          voice_id: req.voiceId,
          speed: req.speed,
          audio_format: req.audioFormat,
          provider_id: req.providerId,
          stream: false,
          ...(req.providerParams ? { provider_params: req.providerParams } : {}),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string; error?: string; code?: string }
        throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`, body.code)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setNewUrl(url)
      setState('playing')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Synthesis failed'
      setError(msg)
      setState('error')
    }
  }, [setNewUrl])

  const streamChunked = useCallback(async (req: TtsSynthRequest) => {
    streamAbortRef.current?.abort()
    const ctrl = new AbortController()
    streamAbortRef.current = ctrl

    setState('streaming')
    setError(null)
    setChunks([])
    setNewUrl(null)

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined

    try {
      const res = await apiFetch('/api/v1/tts/synthesize', {
        method: 'POST',
        signal: ctrl.signal,
        headers: buildHeaders(req.apiKey),
        body: JSON.stringify({
          text: req.text,
          voice_id: req.voiceId,
          speed: req.speed,
          audio_format: req.audioFormat,
          provider_id: req.providerId,
          stream: true,
          ...(req.providerParams ? { provider_params: req.providerParams } : {}),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { message?: string; error?: string; code?: string }
        throw new ApiError(res.status, body.message ?? body.error ?? `HTTP ${res.status}`, body.code)
      }

      reader = res.body?.getReader()
      if (!reader) throw new Error('Response body is not readable')

      const parts: Uint8Array[] = []
      let chunkIndex = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done || ctrl.signal.aborted) break
        parts.push(value)
        setChunks(prev => [...prev, { index: chunkIndex++, byteLength: value.byteLength, receivedAt: Date.now() }])
      }

      if (ctrl.signal.aborted) return

      const fullBlob = new Blob(parts as unknown as BlobPart[], { type: contentTypeForFormat(req.audioFormat) })
      setNewUrl(URL.createObjectURL(fullBlob))
      setState('playing')
    } catch (err) {
      if (ctrl.signal.aborted) return
      setError(err instanceof Error ? err.message : 'Streaming failed')
      setState('error')
    } finally {
      await reader?.cancel().catch(() => {})
    }
  }, [setNewUrl])

  return { state, audioUrl, error, chunks, synthesize, streamChunked, reset }
}
