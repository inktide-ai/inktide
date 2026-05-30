'use client'

import { Check, Clock, X } from 'lucide-react'
import type { WebhookDeliveryDto } from '../api/developer'

interface WebhookDeliveryLogProps {
  deliveries: WebhookDeliveryDto[]
}

function StatusBadge({ statusCode }: { statusCode: number | null }) {
  if (statusCode === null) return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
      <Clock size={12} /> Pending
    </span>
  )
  if (statusCode >= 200 && statusCode < 300) return (
    <span className="inline-flex items-center gap-1 text-xs text-green-500">
      <Check size={12} /> {statusCode}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-400">
      <X size={12} /> {statusCode}
    </span>
  )
}

export function WebhookDeliveryLog({ deliveries }: WebhookDeliveryLogProps) {
  if (deliveries.length === 0) {
    return (
      <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">No webhook deliveries yet.</p>
    )
  }

  return (
    <div className="flex flex-col divide-y divide-[var(--border-subtle)]">
      {deliveries.map(d => (
        <div key={d.id} className="flex items-center justify-between gap-4 py-3 px-1">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">{d.eventType}</span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {new Date(d.createdAt).toLocaleString()} · Attempt {d.attempt}
            </span>
          </div>
          <StatusBadge statusCode={d.statusCode} />
        </div>
      ))}
    </div>
  )
}
