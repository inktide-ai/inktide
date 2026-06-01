export interface VadGateResult {
  shouldEmit: boolean
  humanLabel: string | null
  templateKey: string | null
}

const VALENCE_DELTA_THRESHOLD = 0.35
const BOUNDARY_HIGH = 0.6
const BOUNDARY_LOW  = 0.4
const COOLDOWN_MS   = 4 * 60 * 60 * 1000

export function evaluateVadGate(
  prevValence: number | null,
  currentValence: number,
  currentArousal: number,
  lastEventAt: string | null,
  now: Date = new Date(),
): VadGateResult {
  if (lastEventAt) {
    const elapsed = now.getTime() - new Date(lastEventAt).getTime()
    if (elapsed < COOLDOWN_MS) return { shouldEmit: false, humanLabel: null, templateKey: null }
  }

  const prev  = prevValence ?? 0.5
  const delta = Math.abs(currentValence - prev)
  if (delta < VALENCE_DELTA_THRESHOLD) return { shouldEmit: false, humanLabel: null, templateKey: null }

  return determineLabel(prev, currentValence, currentArousal)
}

function determineLabel(prev: number, current: number, arousal: number): VadGateResult {
  if (current >= BOUNDARY_HIGH && arousal >= 0.7)
    return { shouldEmit: true, humanLabel: 'feeling radiant and full of energy', templateKey: 'mood.radiant_spike' }
  if (current >= BOUNDARY_HIGH && prev < BOUNDARY_HIGH)
    return { shouldEmit: true, humanLabel: 'in a much warmer place emotionally', templateKey: 'mood.positive_cross' }
  if (current <= BOUNDARY_LOW && prev > BOUNDARY_LOW)
    return { shouldEmit: true, humanLabel: 'slipping into a quieter, heavier mood', templateKey: 'mood.negative_cross' }
  if (current > prev)
    return { shouldEmit: true, humanLabel: 'feeling noticeably brighter', templateKey: 'mood.shift_up' }
  return { shouldEmit: true, humanLabel: 'feeling a little more withdrawn', templateKey: 'mood.shift_down' }
}
