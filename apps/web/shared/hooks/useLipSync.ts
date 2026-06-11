'use client'
import { useCallback, useEffect, useRef } from 'react'
import type { MouthWeights, RhubarbViseme, VisemeCue } from '@/shared/types/IVisemeProvider'
import { visemeProviderRegistry } from '../services/lipsync/registry'

// Re-export из ports/ для backward compat (useChatChannel, useAudioStream импортируют отсюда)
export type { MouthWeights, RhubarbViseme, VisemeCue }


export interface LipSyncHandle {
  getAudioContext(): AudioContext
  getAnalyserNode(): AnalyserNode
  getMouthWeights(): MouthWeights
  /**
   * Активирует timeline-режим для текущего аудио-чанка.
   * @param cues  Viseme cues от Rhubarb; null чтобы очистить.
   * @param startT AudioContext.currentTime в момент source.start().
   */
  setVisemeTimeline(cues: VisemeCue[] | null, startT: number): void
}

const FFT_SIZE = 1024

const SILENT_MOUTH: MouthWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }


/**
 * OCP: логика вычисления весов рта вынесена в IVisemeProvider.
 * Добавить новый бэкенд = новый файл в services/lipsync/ + регистрация в registry.ts.
 * Этот хук НЕ МЕНЯЕТСЯ при добавлении новых провайдеров.
 */
export function useLipSync(): LipSyncHandle {
  const ctxRef      = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  /** Active Rhubarb timeline + AudioContext.currentTime когда source.start() был вызван. */
  const timelineRef = useRef<{ cues: VisemeCue[]; startT: number } | null>(null)

  /** Последний использованный провайдер — для сброса сглаживания при смене. */
  const lastProviderIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      const ctx      = new AudioContext()
      const analyser = ctx.createAnalyser()
      analyser.fftSize               = FFT_SIZE
      analyser.smoothingTimeConstant = 0.30
      analyser.connect(ctx.destination)
      ctxRef.current      = ctx
      analyserRef.current = analyser
    }
    return () => {
      ctxRef.current?.close()
      ctxRef.current      = null
      analyserRef.current = null
    }
  }, [])

  const getOrCreate = useCallback((): { ctx: AudioContext; analyser: AnalyserNode } => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      return { ctx: ctxRef.current, analyser: analyserRef.current! }
    }

    const ctx      = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize               = FFT_SIZE
    analyser.smoothingTimeConstant = 0.30
    analyser.connect(ctx.destination)

    ctxRef.current      = ctx
    analyserRef.current = analyser

    return { ctx, analyser }
  }, [])

  const setVisemeTimeline = useCallback((cues: VisemeCue[] | null, startT: number) => {
    timelineRef.current = cues && cues.length > 0 ? { cues, startT } : null
  }, [])

  /**
   * OCP: итерируем реестр провайдеров. Первый подходящий вычисляет веса.
   * useLipSync не знает о конкретных алгоритмах — только об интерфейсе IVisemeProvider.
   */
  const getMouthWeights = useCallback((): MouthWeights => {
    const ctx      = ctxRef.current
    const analyser = analyserRef.current
    const timeline = timelineRef.current

    const visemeCtx = {
      analyserNode: analyser,
      sampleRate: ctx?.sampleRate ?? 0,
      timeline: timeline?.cues ?? null,
      currentTime: ctx?.currentTime ?? 0,
      timelineStartT: timeline?.startT ?? 0,
    }

    const provider = visemeProviderRegistry.find((p) => p.isApplicable(visemeCtx))

    if (!provider) return { ...SILENT_MOUTH }

    // Сброс сглаживания при смене провайдера (например, timeline → formant)
    if (provider.id !== lastProviderIdRef.current) {
      visemeProviderRegistry.forEach((p) => {
        if (p.id !== provider.id) p.reset()
      })
      lastProviderIdRef.current = provider.id
    }

    return provider.getMouthWeights(visemeCtx)
  }, [])

  return {
    getAudioContext:  () => getOrCreate().ctx,
    getAnalyserNode:  () => getOrCreate().analyser,
    getMouthWeights,
    setVisemeTimeline,
  }
}
