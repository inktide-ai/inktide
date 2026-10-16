import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import StreamPage from '@/features/landing/stage/stream-page'
import { getTranslations } from '@/lib/i18n-server'

// The title is the root layout's default; the description is set here so it stays the landing's own.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')
  return { description: t('meta.description') }
}

export default function Home() {
  return (
    <main className={GeistMono.variable}>
      <StreamPage />
    </main>
  )
}
