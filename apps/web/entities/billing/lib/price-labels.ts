import type { PlanPriceDto } from '../api/billing'

export type PriceLabels = Record<'free' | 'starter' | 'pro', string>

/**
 * Formats a price the way the shop charges it. The locale is fixed rather than the UI
 * language: prices are in rubles, and a fixed locale renders the same string on the
 * server and in the browser.
 */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

/** Labels for every plan from GET /api/v1/billing/plans; null if a paid plan is missing. */
export function toPriceLabels(prices: PlanPriceDto[]): PriceLabels | null {
  const starter = prices.find(p => p.plan === 'starter')
  const pro = prices.find(p => p.plan === 'pro')
  if (!starter || !pro) return null
  return {
    free: formatPrice(0, starter.currency),
    starter: formatPrice(starter.amount, starter.currency),
    pro: formatPrice(pro.amount, pro.currency),
  }
}
