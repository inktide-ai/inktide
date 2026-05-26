/**
 * Format a number into a compact string: 1500 → "1.5K", 2000000 → "2.0M"
 */
export function formatApiCalls(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

/**
 * Human-readable "edited N ago" label from an ISO timestamp.
 */
export function editedLabel(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `Edited ${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `Edited ${h}h ago`
  return `Edited ${Math.floor(h / 24)}d ago`
}
