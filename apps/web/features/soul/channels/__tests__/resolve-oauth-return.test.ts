// @ts-nocheck — vitest is not installed yet; see setup instructions below.
// NOTE: No frontend test framework is configured in this project yet.
// These tests require vitest (or jest with jsdom environment).
// Setup: npm install -D vitest @vitest/coverage-v8 jsdom
// Add to apps/web/package.json: "test": "vitest"
// Add vitest.config.ts with environment: 'jsdom'

import { describe, it, expect, beforeEach } from 'vitest'
import { resolveOAuthReturn, saveOAuthPending } from '../resolve-oauth-return'

describe('resolveOAuthReturn', () => {
  beforeEach(() => sessionStorage.clear())

  it('returns false when ?connected param absent', () => {
    const sp = new URLSearchParams('')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('returns false when sessionStorage key absent', () => {
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('returns true for matching soulId + connectorId within TTL', () => {
    saveOAuthPending({ soulId: 's1', connectorId: 'discord', initiatedAt: Date.now() })
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(true)
  })

  it('returns false when soulId mismatches', () => {
    saveOAuthPending({ soulId: 's2', connectorId: 'discord', initiatedAt: Date.now() })
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('returns false when connectorId mismatches', () => {
    saveOAuthPending({ soulId: 's1', connectorId: 'telegram', initiatedAt: Date.now() })
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('returns false when pending state is expired (> 10 min)', () => {
    saveOAuthPending({ soulId: 's1', connectorId: 'discord', initiatedAt: Date.now() - 11 * 60 * 1000 })
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('returns false when sessionStorage contains malformed JSON', () => {
    sessionStorage.setItem('v1_inktide_oauth_pending:discord:s1', '{bad json}')
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('returns false when initiatedAt is missing or not a number', () => {
    sessionStorage.setItem(
      'v1_inktide_oauth_pending:discord:s1',
      JSON.stringify({ soulId: 's1', connectorId: 'discord' }),
    )
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(false)
  })

  it('does NOT remove the key after positive resolution (Strict Mode safe)', () => {
    saveOAuthPending({ soulId: 's1', connectorId: 'discord', initiatedAt: Date.now() })
    const sp = new URLSearchParams('connected=true')
    resolveOAuthReturn(sp, 's1', 'discord')
    expect(sessionStorage.getItem('v1_inktide_oauth_pending:discord:s1')).not.toBeNull()
  })

  it('different connector does not consume another connector pending key', () => {
    saveOAuthPending({ soulId: 's1', connectorId: 'discord', initiatedAt: Date.now() })
    const sp = new URLSearchParams('connected=true')
    expect(resolveOAuthReturn(sp, 's1', 'telegram')).toBe(false)
    expect(resolveOAuthReturn(sp, 's1', 'discord')).toBe(true)
  })
})
