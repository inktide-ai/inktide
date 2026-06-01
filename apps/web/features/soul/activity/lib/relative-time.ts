const MINUTE = 60_000
const HOUR   = 60 * MINUTE
const DAY    = 24 * HOUR

export function formatRelativeTime(date: Date): string {
  const elapsed = Date.now() - date.getTime()

  if (elapsed < MINUTE)      return 'just now'
  if (elapsed < HOUR)        return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY)         return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 7 * DAY)    return `${Math.floor(elapsed / DAY)}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
