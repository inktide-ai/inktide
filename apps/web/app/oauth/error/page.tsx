'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

function OAuthErrorContent() {
  const params = useSearchParams()
  const error = params.get('error') ?? 'Authorization failed'
  const description = params.get('error_description')

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-0)] px-4">
      <div className="max-w-sm w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center flex flex-col gap-4">
        <AlertCircle size={32} className="text-red-400 mx-auto" />
        <div>
          <p className="text-base font-semibold text-[var(--text-heading)]">Authorization Error</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{error}</p>
          {description && <p className="text-xs text-[var(--text-tertiary)] mt-2">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default function OAuthErrorPage() {
  return (
    <Suspense>
      <OAuthErrorContent />
    </Suspense>
  )
}
