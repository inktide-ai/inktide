'use client'

import './globals.css'
import { useEffect } from 'react'
import { GeistSans } from 'geist/font/sans'
import { ErrorScreen } from '@/widgets/error-screen'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

// Catches errors in the root layout itself, which this replaces: no providers or
// i18n here, so it brings its own styles and English copy.
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global Error]', error)
  }, [error])

  return (
    <html lang="en" data-scroll-behavior="smooth" className={GeistSans.variable}>
      <body className="antialiased">
        <ErrorScreen
          code="500"
          caption="Technical difficulties"
          title="Something went wrong"
          description="An unexpected error occurred."
          primary={{ label: 'Reload', onClick: reset }}
          secondary={{ label: 'Back to home', href: '/' }}
          reference={error.digest}
        />
      </body>
    </html>
  )
}
