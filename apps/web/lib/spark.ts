/**
 * Builds a cumulative sparkline from an array of ISO date strings.
 * Returns `buckets` values representing cumulative item count over time,
 * windowed from the oldest item to now (or last 30 days, whichever is larger).
 */
export function buildSpark(dates: string[], buckets = 7): number[] {
  if (dates.length === 0) return new Array<number>(buckets).fill(0)

  const timestamps = dates.map(d => new Date(d).getTime()).sort((a, b) => a - b)
  const now = Date.now()
  const windowStart = Math.min(timestamps[0], now - 30 * 24 * 60 * 60 * 1000)
  const windowMs = Math.max(now - windowStart, 1)
  const bucketMs = windowMs / buckets

  const counts = new Array<number>(buckets).fill(0)
  for (const ts of timestamps) {
    const idx = Math.min(buckets - 1, Math.floor((ts - windowStart) / bucketMs))
    counts[idx]++
  }

  // cumulative
  for (let i = 1; i < buckets; i++) {
    counts[i] += counts[i - 1]
  }

  return counts
}
