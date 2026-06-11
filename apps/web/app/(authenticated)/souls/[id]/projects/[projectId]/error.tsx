'use client'
import { useEffect } from 'react'

export default function SoulProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
      <p className="text-sm text-[var(--text-secondary)]">Failed to load project.</p>
      <button onClick={reset} className="text-xs text-[var(--accent)] hover:underline">
        Retry
      </button>
    </div>
  )
}
