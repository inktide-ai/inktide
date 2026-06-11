'use client'

import { useEffect } from 'react'

export default function SoulsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[Souls Error]', error) }, [error])
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <p className="text-sm text-[var(--text-secondary)]">Failed to load AI cards.</p>
      <button onClick={reset} className="text-xs text-[var(--accent)] hover:underline">
        Retry
      </button>
    </div>
  )
}
