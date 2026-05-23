'use client'

import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to your error tracking service here (e.g., Sentry.captureException(error))
    console.error('[Route Error]', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">Something went wrong</h2>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">
        {error.digest ? `Error ID: ${error.digest}` : 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Try again
      </button>
    </div>
  )
}
