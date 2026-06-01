import type { ActivityDayGroup, SoulActivityEvent } from '../types'

export function groupByDay(events: SoulActivityEvent[]): ActivityDayGroup[] {
  const map = new Map<string, SoulActivityEvent[]>()

  for (const event of events) {
    const dayKey = event.occurred_at.slice(0, 10) // "YYYY-MM-DD"
    const bucket = map.get(dayKey)
    if (bucket) {
      bucket.push(event)
    } else {
      map.set(dayKey, [event])
    }
  }

  return Array.from(map.entries()).map(([dayKey, evs]) => ({ dayKey, events: evs }))
}
