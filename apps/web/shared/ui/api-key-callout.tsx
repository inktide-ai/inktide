'use client'

interface ApiKeyCalloutProps {
  show: boolean
  message?: string
}

export function ApiKeyCallout({ show, message }: ApiKeyCalloutProps) {
  if (!show) return null
  return (
    <div
      className="flex items-start gap-2 py-[0.625rem] px-[0.875rem] rounded-[8px] bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-[0.8rem] text-(--text-secondary) mb-4"
      role="alert"
    >
      <span className="text-[#f59e0b] shrink-0">⚠</span>
      <span>{message ?? 'An API key is required to use this provider.'}</span>
    </div>
  )
}
