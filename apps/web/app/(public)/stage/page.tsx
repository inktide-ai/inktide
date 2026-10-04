import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import StreamPage from '@/features/landing/stage/stream-page'

// Preview route for the "the site is a stream" landing while its scenes are
// being built; it replaces the hero on `/` once the direction is settled.
export const metadata: Metadata = {
  title: { absolute: 'Quackie — Starting soon' },
  robots: { index: false, follow: false },
}

export default function StagePreviewPage() {
  return (
    <main className={GeistMono.variable}>
      <StreamPage />
    </main>
  )
}
