/**
 * OCP: добавить новый lip-sync бэкенд (ARKit, OVR, ...) = создать новый файл с `implements IVisemeProvider`
 * и добавить его в services/lipsync/registry.ts. useLipSync.ts НЕ МЕНЯЕТСЯ.
 */

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

/** Single viseme cue from the backend timeline — matches the existing useLipSync.ts contract. */
export interface VisemeCue {
  /** Milliseconds from the start of the audio chunk. */
  startMs: number
  viseme: RhubarbViseme
}

export interface VisemeContext {
  /** Web Audio AnalyserNode для formant-анализа; null если недоступен. */
  analyserNode: AnalyserNode | null
  /** Web Audio sampleRate; 0 если AudioContext не создан. */
  sampleRate: number
  /** Rhubarb-таймлайн от бэкенда; null если не передан. */
  timeline: VisemeCue[] | null
  /** AudioContext.currentTime в момент вычисления (секунды). */
  currentTime: number
  /** AudioContext.currentTime в момент когда source.start() был вызван. */
  timelineStartT: number
}

export interface IVisemeProvider {
  /** Уникальный идентификатор провайдера (для отладки). */
  readonly id: string
  /** Возвращает true, если провайдер применим в данном контексте. */
  isApplicable(ctx: VisemeContext): boolean
  /**
   * Вычисляет сглаженные веса рта для текущего кадра.
   * Провайдер хранит собственное состояние сглаживания.
   */
  getMouthWeights(ctx: VisemeContext): MouthWeights
  /** Сброс внутреннего состояния сглаживания (вызывается при смене провайдера). */
  reset(): void
}
