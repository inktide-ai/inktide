import type { IVisemeProvider, MouthWeights, VisemeContext } from '@/shared/types/IVisemeProvider'

// ── Formant bands (Hz) ────────────────────────────────────────────────────────
const FUND_LO = 80;    const FUND_HI = 300
const F1_LO   = 300;   const F1_HI   = 900
const F2_LO   = 900;   const F2_HI   = 2500
const SIB_LO  = 2500;  const SIB_HI  = 8000
const GATE_LO = 80;    const GATE_HI = 8000

const FFT_SIZE            = 1024
const AMPLITUDE_SCALE     = 3.5
const SILENCE_THRESHOLD   = 0.012
const FM_ATTACK           = 0.48
const FM_DECAY            = 0.45

/**
 * OCP: провайдер реального времени через F1/F2 formant-анализ.
 * Используется как fallback когда Rhubarb-таймлайн недоступен.
 * Добавление нового провайдера = новый файл, этот не меняется.
 */
export class FormantVisemeProvider implements IVisemeProvider {
  readonly id = 'formant-fallback'

  private _smoothed: MouthWeights = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }
  private _freqData: Uint8Array<ArrayBuffer> | null = null

  isApplicable(ctx: VisemeContext): boolean {
    return ctx.analyserNode !== null
  }

  getMouthWeights(ctx: VisemeContext): MouthWeights {
    const { analyserNode, sampleRate } = ctx
    if (!analyserNode || !sampleRate) return { ...this._smoothed }

    if (!this._freqData || this._freqData.length !== analyserNode.frequencyBinCount) {
      this._freqData = new Uint8Array(analyserNode.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }
    analyserNode.getByteFrequencyData(this._freqData)

    const binHz = sampleRate / FFT_SIZE
    const freqData = this._freqData

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
      return this._smooth({ aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 })
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

    return this._smooth({
      aa: amp * (1 - Math.min(shapeOu * 0.75, 0.70)) * (1 - Math.min(shapeEe * 0.55, 0.45)),
      ou: Math.min(shapeOu * amp * 1.40, 1),
      ee: shapeEe * amp * 1.35,
      oh: Math.max(0, r1 - r2) * amp * 0.85,
      ih: (r2 * 0.85 + rs * 0.55) * amp * (1 - shapeOu * 0.50),
    })
  }

  reset(): void {
    this._smoothed = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _smooth(target: MouthWeights): MouthWeights {
    const s = this._smoothed
    const lerp = (cur: number, tgt: number) =>
      cur + (tgt > cur ? FM_ATTACK : FM_DECAY) * (tgt - cur)
    s.aa = Math.min(lerp(s.aa, target.aa), 1)
    s.ih = Math.min(lerp(s.ih, target.ih), 1)
    s.ou = Math.min(lerp(s.ou, target.ou), 1)
    s.ee = Math.min(lerp(s.ee, target.ee), 1)
    s.oh = Math.min(lerp(s.oh, target.oh), 1)
    return { ...s }
  }
}
