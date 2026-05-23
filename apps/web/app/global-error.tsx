'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Catches errors in the root layout itself. Minimal UI — no theme/providers available.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', background: '#0f0f0f', color: '#f0f0f0' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Application error</h2>
          <p style={{ marginBottom: '1rem', opacity: 0.6, fontSize: '0.875rem' }}>
            {error.digest ? `Ref: ${error.digest}` : 'A critical error occurred.'}
          </p>
          <button
            onClick={reset}
            style={{ padding: '0.5rem 1.25rem', background: '#7c5cfc', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
