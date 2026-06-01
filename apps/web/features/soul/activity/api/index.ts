import type { SoulActivityFeedPage } from '../types'

export async function getPublicActivity(
  slug: string,
  params: { limit?: number; cursor?: string },
): Promise<SoulActivityFeedPage> {
  const qs = new URLSearchParams()
  if (params.limit !== undefined) qs.set('limit', String(params.limit))
  if (params.cursor) qs.set('cursor', params.cursor)

  const res = await fetch(`/api/soul/public/${encodeURIComponent(slug)}/activity?${qs}`)
  if (!res.ok) throw new Error(`Activity feed error: ${res.status}`)
  return res.json() as Promise<SoulActivityFeedPage>
}
