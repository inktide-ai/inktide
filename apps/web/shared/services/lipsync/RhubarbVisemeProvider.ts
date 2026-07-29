import type { IVisemeProvider, MouthWeights, RhubarbViseme, VisemeContext, VisemeCue } from '@/shared/types/IVisemeProvider'

//
// Derived from crates/inktide-rendering/src/vrm_viseme.rs, adapted to the
// five standard VRM expressions (aa / ih / ou / ee / oh).
//
//  X  - silence / rest
//  A  - P, B, M  (lips pressed together - fully closed)
//  B  - K, G, NG (back-of-mouth stop)
//  C  - CH, J, SH, ZH, Y (sibilant / affricate)
//  D  - EH, AE, IH, IY, EY (front vowels - E / I)
//  E  - AH, AO, AW (open vowels - A / O)
//  F  - F, V (labiodental - lower lip to upper teeth)
//  G  - TH, DH (dental fricative)
//  H  - L, D, N (tongue tip at alveolar ridge)
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

// Faster constants: target is already smooth - we just need crisp tracking.
const TL_ATTACK       = 0.75  // fast snap to target pose
const TL_DECAY        = 0.60  // fast close for open -> open transitions
const TL_DECAY_CLOSED = 0.92  // near-instant close for A/X (P, B, M, silence)
const HOLD_RATIO      = 0.65  // hold shape for 65% of cue duration, then blend
const AUDIO_OFFSET_MS = -30   // anticipatory coarticulation

const SILENT_MOUTH: MouthWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }

/**
 * OCP: провайдер Rhubarb timeline-режима.
 * Вычисляет веса рта по серии viseme cue-точек из бэкенда.
 * Добавление нового провайдера = новый файл, этот не меняется.
 */
export class RhubarbVisemeProvider implements IVisemeProvider {
  readonly id = 'rhubarb-timeline'

  private _smoothed: MouthWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }

  isApplicable(ctx: VisemeContext): boolean {
    return ctx.timeline !== null && ctx.timeline.length > 0
  }

  getMouthWeights(ctx: VisemeContext): MouthWeights {
    const target = this._computeTarget(ctx.timeline!, ctx.currentTime, ctx.timelineStartT)
    const isClosed = target.aa < 0.05 && target.ih < 0.05 && target.ou < 0.05
      && target.ee < 0.05 && target.oh < 0.05
    return this._smooth(target, TL_ATTACK, isClosed ? TL_DECAY_CLOSED : TL_DECAY)
  }

  reset(): void {
    this._smoothed = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }
  }


  private _computeTarget(cues: VisemeCue[], currentTime: number, timelineStartT: number): MouthWeights {
    const elapsedMs = (currentTime - timelineStartT) * 1000 + AUDIO_OFFSET_MS

    // Find the last cue whose startMs <= elapsedMs
    let idx = 0
    for (let i = 1; i < cues.length; i++) {
      if (cues[i].startMs <= elapsedMs) idx = i
      else break
    }

    const cur  = this._safeWeights(cues[idx].viseme)
    const next = cues[idx + 1]

    if (!next) return { ...cur }

    // Hold the current shape for HOLD_RATIO of its duration, then fast-blend.
    const span = next.startMs - cues[idx].startMs
    const rawT = span > 0 ? Math.min((elapsedMs - cues[idx].startMs) / span, 1) : 0
    const t    = rawT < HOLD_RATIO ? 0 : (rawT - HOLD_RATIO) / (1 - HOLD_RATIO)
    const nxt  = this._safeWeights(next.viseme)

    return {
      aa: cur.aa + (nxt.aa - cur.aa) * t,
      ih: cur.ih + (nxt.ih - cur.ih) * t,
      ou: cur.ou + (nxt.ou - cur.ou) * t,
      ee: cur.ee + (nxt.ee - cur.ee) * t,
      oh: cur.oh + (nxt.oh - cur.oh) * t,
    }
  }

  private _safeWeights(viseme: string): MouthWeights {
    const w = (VISEME_WEIGHTS as Record<string, MouthWeights>)[viseme]
    if (!w) {
      console.warn(`[RhubarbVisemeProvider] unknown viseme '${viseme}' — falling back to X (silence)`)
      return VISEME_WEIGHTS['X']
    }
    return w
  }

  private _smooth(target: MouthWeights, attack: number, decay: number): MouthWeights {
    const s = this._smoothed
    const lerp = (cur: number, tgt: number) => cur + (tgt > cur ? attack : decay) * (tgt - cur)
    s.aa = Math.min(lerp(s.aa, target.aa), 1)
    s.ih = Math.min(lerp(s.ih, target.ih), 1)
    s.ou = Math.min(lerp(s.ou, target.ou), 1)
    s.ee = Math.min(lerp(s.ee, target.ee), 1)
    s.oh = Math.min(lerp(s.oh, target.oh), 1)
    return { ...s }
  }
}

export { SILENT_MOUTH }
