export function formatDayLabel(dayKey: string): string {
  const date  = new Date(`${dayKey}T00:00:00Z`)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - date.getTime()) / 86_400_000)

  if (diffDays === 0) {
    return `Today · ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`
  }
  if (diffDays === 1) {
    return `Yesterday · ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`
  }
  if (diffDays <= 7) {
    return `Last week · ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })}`
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
