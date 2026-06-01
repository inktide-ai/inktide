import { ActivityItem } from './activity-item'
import type { SoulActivityEvent } from '../types'

interface Props {
  label: string
  events: SoulActivityEvent[]
  startIndex: number
}

export function ActivityDayGroup({ label, events, startIndex }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 py-1">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
          {label}
        </span>
        <span className="h-px flex-1 bg-[var(--border-subtle)]" />
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {events.map((event, i) => (
          <ActivityItem key={event.id} event={event} index={startIndex + i} />
        ))}
      </div>
    </section>
  )
}
