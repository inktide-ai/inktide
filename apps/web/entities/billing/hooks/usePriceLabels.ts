'use client'
import { useQuery } from '@tanstack/react-query'
import { getPlanPrices } from '@/entities/billing/api/billing'
import { toPriceLabels, type PriceLabels } from '@/entities/billing/lib/price-labels'
import { queryKeys } from '@/shared/lib/query/keys'

/** Price labels for client pages (checkout, account billing); null until the prices load. */
export function usePriceLabels(): PriceLabels | null {
  const { data } = useQuery({
    queryKey: queryKeys.billing.plans,
    queryFn: getPlanPrices,
    select: toPriceLabels,
    staleTime: 5 * 60_000,
  })
  return data ?? null
}
