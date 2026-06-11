import { type Metadata } from 'next'
import { serverApiUrl } from '@/shared/lib/api-url'
import { PageClient } from './_page-client'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params
  try {
    const res = await fetch(
      `${serverApiUrl()}/api/soul/public/${encodeURIComponent(id)}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) throw new Error('not found')
    const soul = await res.json() as {
      name: string
      description: string
      avatar_url: string | null
      personality: string
    }
    const description = soul.description || soul.personality?.slice(0, 160) || 'AI streaming character'
    return {
      title: soul.name,
      description,
      openGraph: {
        title: soul.name,
        description,
        images: soul.avatar_url ? [soul.avatar_url] : [],
      },
      twitter: {
        card: 'summary',
        title: soul.name,
        description,
        images: soul.avatar_url ? [soul.avatar_url] : [],
      },
    }
  } catch {
    return { title: 'Soul Profile' }
  }
}

export default function Page() {
  return <PageClient />
}
