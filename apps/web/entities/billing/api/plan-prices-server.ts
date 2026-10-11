// server-only helper - do NOT import in client components
import { serverApiUrl } from '@/shared/lib/api-url'
import type { PlanPriceDto } from '@/entities/billing/api/billing'
import { toPriceLabels, type PriceLabels } from '@/entities/billing/lib/price-labels'

/**
 * Price labels for server-rendered pricing (landing, /pricing). When the API is down the
 * page still renders, just without prices, and the failure goes to the server log.
 */
export async function fetchPriceLabels(): Promise<PriceLabels | null> {
  try {
    const res = await fetch(`${serverApiUrl()}/api/v1/billing/plans`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return toPriceLabels(await res.json() as PlanPriceDto[])
  } catch (error) {
    console.error('[Pricing] GET /api/v1/billing/plans failed', error)
    return null
  }
}
