'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Catches errors in the root layout itself. Minimal UI - no theme/providers available.
// Uses hardcoded Tailwind values (CSS vars from globals.css are unavailable at this boundary).
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="flex min-h-screen items-center justify-center font-sans bg-[#0f0f0f] text-[#f0f0f0]">
        <div className="text-center p-8">
          <h2 className="mb-2">Application error</h2>
          <p className="mb-4 opacity-60 text-sm">
            {error.digest ? `Ref: ${error.digest}` : 'A critical error occurred.'}
          </p>
          <button
            onClick={reset}
            className="py-2 px-5 bg-[#7c5cfc] border-0 rounded-[6px] text-white cursor-pointer"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
