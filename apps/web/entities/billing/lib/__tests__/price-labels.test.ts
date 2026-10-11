import { describe, expect, it } from 'vitest'
import { formatPrice, toPriceLabels } from '../price-labels'

// Intl separates groups and the symbol with no-break spaces; compare with plain ones.
const plain = (s: string) => s.replace(/\s/g, ' ')

describe('formatPrice', () => {
  it('formats whole rubles without kopecks', () => {
    expect(plain(formatPrice(1390, 'RUB'))).toBe('1 390 ₽')
  })

  it('keeps kopecks when the amount has them', () => {
    expect(plain(formatPrice(1376.74, 'RUB'))).toBe('1 376,74 ₽')
  })
})

describe('toPriceLabels', () => {
  it('labels both paid plans and shows Free as zero in the same currency', () => {
    const labels = toPriceLabels([
      { plan: 'starter', amount: 1390, currency: 'RUB' },
      { plan: 'pro', amount: 2890, currency: 'RUB' },
    ])

    expect(labels && Object.fromEntries(Object.entries(labels).map(([k, v]) => [k, plain(v)]))).toEqual({
      free: '0 ₽',
      starter: '1 390 ₽',
      pro: '2 890 ₽',
    })
  })

  it('returns null when the API did not price a plan', () => {
    expect(toPriceLabels([{ plan: 'starter', amount: 1390, currency: 'RUB' }])).toBeNull()
  })
})
