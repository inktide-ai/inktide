import { useCallback, useEffect, useRef } from 'react'

// ── Public types ──────────────────────────────────────────────────────────────

export interface MouthWeights {
  /** Open vowel "A"    — jaw drop, neutral lip shape.   0 = closed, 1 = open. */
  aa: number
  /** Front mid "I/E"  — lips slightly spread inward. */
  ih: number
  /** Rounded close "U"— lips pursed forward. */
  ou: number
  /** Front close "EE" — lips flat, wide spread. */
  ee: number
  /** Back mid "O"     — lips rounded, jaw half open. */
  oh: number
}

/** Rhubarb mouth shape letters (Preston Blair set). */
export type RhubarbViseme = 'X' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'

/** Single viseme cue from the backend timeline. */
export interface VisemeCue {
  /** Milliseconds from the start of the audio chunk. */
  startMs: number
  viseme: RhubarbViseme
}

export interface LipSyncHandle {
  /**
   * Returns (or lazily creates) the shared AudioContext.
   * Call only after a user gesture or inside an audio-stream callback.
   */
  getAudioContext(): AudioContext
  /** Returns the AnalyserNode — connect audio sources through it for live analysis. */
  getAnalyserNode(): AnalyserNode
  /** Returns current mouth shape weights. Call once per animation frame. */
  getMouthWeights(): MouthWeights
  /**
   * Activates timeline-based playback for the current audio chunk.
   *
   * @param cues   Viseme cues from the Rhubarb pipeline, or `null` to clear.
   * @param startT `AudioContext.currentTime` at the moment `source.start()` was called.
   *               Used to compute elapsed playback time on each animation frame.
   */
  setVisemeTimeline(cues: VisemeCue[] | null, startT: number): void
}

// ── Rhubarb → VRM blend-shape weights ────────────────────────────────────────
//
// Derived from crates/chimera-rendering/src/vrm_viseme.rs, adapted to the
// five standard VRM expressions we drive (aa / ih / ou / ee / oh).
//
//  X  — silence / rest
//  A  — P, B, M  (lips pressed together — fully closed)
//  B  — K, G, NG (back-of-mouth stop)
//  C  — CH, J, SH, ZH, Y (sibilant / affricate)
//  D  — EH, AE, IH, IY, EY (front vowels — E / I)
//  E  — AH, AO, AW (open vowels — A / O)
//  F  — F, V (labiodental — lower lip to upper teeth)
//  G  — TH, DH (dental fricative)
//  H  — L, D, N (tongue tip at alveolar ridge)
//
const VISEME_WEIGHTS: Record<RhubarbViseme, MouthWeights> = {
  X: { aa: 0.00, ih: 0.00, ou: 0.00, ee: 0.00, oh: 0.00 },
  A: { aa: 0.00, ih: 0.00, ou: 0.00, ee: 0.00, oh: 0.00 }, // fully closed
  B: { aa: 0.35, ih: 0.00, ou: 0.00, ee: 0.00, oh: 0.15 },
  C: { aa: 0.10, ih: 0.50, ou: 0.00, ee: 0.25, oh: 0.00 },
  D: { aa: 0.20, ih: 0.70, ou: 0.00, ee: 0.50, oh: 0.00 },
  E: { aa: 0.80, ih: 0.00, ou: 0.00, ee: 0.00, oh: 0.30 },
  F: { aa: 0.00, ih: 0.20, ou: 0.40, ee: 0.00, oh: 0.00 },
  G: { aa: 0.10, ih: 0.30, ou: 0.00, ee: 0.00, oh: 0.00 },
  H: { aa: 0.30, ih: 0.20, ou: 0.00, ee: 0.00, oh: 0.00 },
}

// ── Constants ─────────────────────────────────────────────────────────────────

// Larger FFT → better formant frequency resolution (≈ 47 Hz/bin @ 48 kHz)
const FFT_SIZE = 1024

// ── Formant bands (Hz) — used only in fallback mode ──────────────────────────
const FUND_LO = 80;    const FUND_HI = 300
const F1_LO   = 300;   const F1_HI   = 900
const F2_LO   = 900;   const F2_HI   = 2500
const SIB_LO  = 2500;  const SIB_HI  = 8000
const GATE_LO = 80;    const GATE_HI = 8000

const AMPLITUDE_SCALE   = 3.5
const SILENCE_THRESHOLD = 0.012

// Timeline mode (Rhubarb / amplitude backend cues)
// Faster constants because the target is already a smooth blend — we just need crisp tracking.
const TL_ATTACK       = 0.75  // fast snap to target pose
const TL_DECAY        = 0.60  // fast close for open → open transitions
const TL_DECAY_CLOSED = 0.92  // near-instant close for A/X (P, B, M, silence)

// Hold phase: don't start blending toward the next cue until we're 65% through
// the current cue's duration. Each phoneme holds its distinctive shape, then transitions quickly.
const HOLD_RATIO = 0.65

// Formant fallback mode (browser real-time analysis — rarely used since backend always sends timeline)
const FM_ATTACK = 0.48
const FM_DECAY  = 0.45

// Anticipatory coarticulation: mouth starts moving slightly before the sound arrives.
const AUDIO_OFFSET_MS = -30

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Creates a shared Web Audio graph and exposes `getMouthWeights()` with two modes:
 *
 * **Timeline mode** (Path 2 — Rhubarb):
 *   When a `VisemeTimeline` is active (set via `setVisemeTimeline`), weights are
 *   derived by linearly blending adjacent Rhubarb cues at the current playback time.
 *   This gives phoneme-accurate lip sync synced to the actual audio.
 *
 * **Formant mode** (Path 1 — fallback):
 *   When no timeline is set, weights are derived from real-time F1/F2 analysis of
 *   the audio spectrum. Automatic fallback when Rhubarb is unavailable.
 */
export function useLipSync(): LipSyncHandle {
  const ctxRef      = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const smoothed    = useRef<MouthWeights>({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 })

  /** Active Rhubarb timeline + the AudioContext.currentTime when audio.start() fired. */
  const timelineRef = useRef<{ cues: VisemeCue[]; startT: number } | null>(null)

  useEffect(() => {
    return () => { ctxRef.current?.close() }
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
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>

    return { ctx, analyser }
  }, [])

  const setVisemeTimeline = useCallback((cues: VisemeCue[] | null, startT: number) => {
    timelineRef.current = cues && cues.length > 0 ? { cues, startT } : null
  }, [])

  const getMouthWeights = useCallback((): MouthWeights => {
    const s = smoothed.current

    const applySmoothed = (target: MouthWeights, attack: number, decay: number): MouthWeights => {
      const lerp = (cur: number, tgt: number): number =>
        cur + (tgt > cur ? attack : decay) * (tgt - cur)
      s.aa = Math.min(lerp(s.aa, target.aa), 1)
      s.ih = Math.min(lerp(s.ih, target.ih), 1)
      s.ou = Math.min(lerp(s.ou, target.ou), 1)
      s.ee = Math.min(lerp(s.ee, target.ee), 1)
      s.oh = Math.min(lerp(s.oh, target.oh), 1)
      return { aa: s.aa, ih: s.ih, ou: s.ou, ee: s.ee, oh: s.oh }
    }

    // ── Timeline mode (Rhubarb) ───────────────────────────────────────────────
    const timeline = timelineRef.current
    const ctx      = ctxRef.current

    if (timeline && ctx) {
      const elapsedMs = (ctx.currentTime - timeline.startT) * 1000 + AUDIO_OFFSET_MS
      const { cues }  = timeline

      // Find the last cue whose startMs ≤ elapsedMs (binary-search style)
      let idx = 0
      for (let i = 1; i < cues.length; i++) {
        if (cues[i].startMs <= elapsedMs) idx = i
        else break
      }

      const cur  = VISEME_WEIGHTS[cues[idx].viseme]
      const next = cues[idx + 1]

      let target: MouthWeights
      if (next) {
        // Hold the current viseme shape for HOLD_RATIO of its duration, then fast-blend.
        // This lets each phoneme read clearly before transitioning to the next.
        const span = next.startMs - cues[idx].startMs
        const rawT = span > 0 ? Math.min((elapsedMs - cues[idx].startMs) / span, 1) : 0
        const t    = rawT < HOLD_RATIO ? 0 : (rawT - HOLD_RATIO) / (1 - HOLD_RATIO)
        const nxt  = VISEME_WEIGHTS[next.viseme]
        target = {
          aa: cur.aa + (nxt.aa - cur.aa) * t,
          ih: cur.ih + (nxt.ih - cur.ih) * t,
          ou: cur.ou + (nxt.ou - cur.ou) * t,
          ee: cur.ee + (nxt.ee - cur.ee) * t,
          oh: cur.oh + (nxt.oh - cur.oh) * t,
        }
      } else {
        target = { ...cur }
      }

      // Closed visemes (A = P/B/M, X = silence) snap shut near-instantly.
      const isClosed = target.aa < 0.05 && target.ih < 0.05 && target.ou < 0.05
        && target.ee < 0.05 && target.oh < 0.05
      return applySmoothed(target, TL_ATTACK, isClosed ? TL_DECAY_CLOSED : TL_DECAY)
    }

    // ── Formant fallback mode ─────────────────────────────────────────────────
    const analyser = analyserRef.current
    const freqData = freqDataRef.current

    if (!analyser || !freqData || !ctx) return { ...s }

    analyser.getByteFrequencyData(freqData)

    const binHz = ctx.sampleRate / analyser.fftSize

    const rms = (lo: number, hi: number): number => {
      const a = Math.max(0, Math.floor(lo / binHz))
      const b = Math.min(freqData.length - 1, Math.floor(hi / binHz))
      if (a > b) return 0
      let sq = 0
      for (let i = a; i <= b; i++) { const v = freqData[i] / 255; sq += v * v }
      return Math.sqrt(sq / (b - a + 1))
    }

    const amp = Math.min(rms(GATE_LO, GATE_HI) * AMPLITUDE_SCALE, 1.0)

    if (amp < SILENCE_THRESHOLD) {
      return applySmoothed({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }, FM_ATTACK, FM_DECAY)
    }

    const eFund = rms(FUND_LO, FUND_HI)
    const eF1   = rms(F1_LO,   F1_HI)
    const eF2   = rms(F2_LO,   F2_HI)
    const eSib  = rms(SIB_LO,  SIB_HI)

    const norm = eFund + eF1 + eF2 + eSib + 1e-6
    const rf = eFund / norm
    const r1 = eF1   / norm
    const r2 = eF2   / norm
    const rs = eSib  / norm

    const shapeOu = rf * 1.5 + Math.max(0, 0.4 - r1 - r2)
    const shapeEe = Math.max(0, r2 - r1)

    return applySmoothed({
      aa: amp * (1 - Math.min(shapeOu * 0.75, 0.70)) * (1 - Math.min(shapeEe * 0.55, 0.45)),
      ou: Math.min(shapeOu * amp * 1.40, 1),
      ee: shapeEe * amp * 1.35,
      oh: Math.max(0, r1 - r2) * amp * 0.85,
      ih: (r2 * 0.85 + rs * 0.55) * amp * (1 - shapeOu * 0.50),
    }, FM_ATTACK, FM_DECAY)
  }, [])

  return {
    getAudioContext:  () => getOrCreate().ctx,
    getAnalyserNode:  () => getOrCreate().analyser,
    getMouthWeights,
    setVisemeTimeline,
  }
}
