import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPriceLabels } from '../plan-prices-server'

const plain = (s: string) => s.replace(/\s/g, ' ')

describe('fetchPriceLabels', () => {
  beforeEach(() => {
    vi.stubEnv('BACKEND_URL', 'http://api:5001')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('asks the API container (BACKEND_URL) for the prices checkout charges', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { plan: 'starter', amount: 1390, currency: 'RUB' },
      { plan: 'pro', amount: 2890, currency: 'RUB' },
    ])))
    vi.stubGlobal('fetch', fetchMock)

    const labels = await fetchPriceLabels()

    expect(fetchMock.mock.calls[0][0]).toBe('http://api:5001/api/v1/billing/plans')
    expect(labels && plain(labels.starter)).toBe('1 390 ₽')
    expect(labels && plain(labels.pro)).toBe('2 890 ₽')
  })

  it('renders without prices and logs when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await fetchPriceLabels()).toBeNull()
    expect(log).toHaveBeenCalledOnce()
  })
})
