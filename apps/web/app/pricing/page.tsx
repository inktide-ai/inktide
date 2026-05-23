'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { useBilling } from '@/context/BillingContext'

// ── Check icon ────────────────────────────────────────────────────────────────

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function Dash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
    </svg>
  )
}

// ── Tier data ─────────────────────────────────────────────────────────────────

const FEATURES = [
  'AI souls',
  'Messages / month',
  'Simultaneous platforms',
  'Custom voice model',
  'Long-term memory',
  'Memory analytics',
  'Chat sandbox',
  'OBS browser source',
  'Public soul card',
  'API access',
  'Team seats',
  'Priority support',
] as const

type Feature = typeof FEATURES[number]

interface Tier {
  key: 'free' | 'pro' | 'studio'
  name: string
  price: string
  period: string
  description: string
  cta: string
  features: Record<Feature, string | boolean>
}

const TIERS: Tier[] = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started and explore AI streaming.',
    cta: 'Get started free',
    features: {
      'AI souls': '1',
      'Messages / month': '100K',
      'Simultaneous platforms': '1',
      'Custom voice model': false,
      'Long-term memory': false,
      'Memory analytics': false,
      'Chat sandbox': true,
      'OBS browser source': true,
      'Public soul card': false,
      'API access': false,
      'Team seats': false,
      'Priority support': false,
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19',
    period: 'per month',
    description: 'For streamers who want a powerful AI presence.',
    cta: 'Upgrade to Pro',
    features: {
      'AI souls': '5',
      'Messages / month': '1M',
      'Simultaneous platforms': 'All',
      'Custom voice model': true,
      'Long-term memory': true,
      'Memory analytics': true,
      'Chat sandbox': true,
      'OBS browser source': true,
      'Public soul card': true,
      'API access': false,
      'Team seats': false,
      'Priority support': true,
    },
  },
  {
    key: 'studio',
    name: 'Studio',
    price: '$49',
    period: 'per month',
    description: 'Unlimited scale for agencies and power users.',
    cta: 'Get Studio',
    features: {
      'AI souls': 'Unlimited',
      'Messages / month': 'Unlimited',
      'Simultaneous platforms': 'All',
      'Custom voice model': true,
      'Long-term memory': true,
      'Memory analytics': true,
      'Chat sandbox': true,
      'OBS browser source': true,
      'Public soul card': true,
      'API access': true,
      'Team seats': '3 seats',
      'Priority support': true,
    },
  },
]

// ── Tier card ─────────────────────────────────────────────────────────────────

function TierCard({ tier, onUpgrade }: { tier: Tier; onUpgrade: (key: Tier['key']) => void }) {
  const isPro = tier.key === 'pro'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl p-7',
        'border bg-[var(--surface-card)]',
        isPro
          ? 'border-[var(--accent-primary)] shadow-[0_0_0_1px_var(--accent-primary),0_8px_32px_rgba(108,71,255,0.18)]'
          : 'border-[var(--border-card)]',
      )}
    >
      {isPro && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-[var(--accent-primary)] px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-white">
            Most Popular
          </span>
        </div>
      )}

      <p className={cn('text-[15px] font-semibold', isPro ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]')}>
        {tier.name}
      </p>

      <div className="mt-3 flex items-end gap-1.5">
        <span className="text-[42px] font-bold leading-none tracking-[-0.03em] text-[var(--text-primary)]">
          {tier.price}
        </span>
        <span className="mb-1.5 text-[14px] text-[var(--text-tertiary)]">{tier.period}</span>
      </div>

      <p className="mt-2 text-[14px] text-[var(--text-secondary)]">{tier.description}</p>

      <button
        type="button"
        onClick={() => onUpgrade(tier.key)}
        className={cn(
          'mt-6 w-full rounded-xl py-2.5 text-[14px] font-semibold transition-opacity hover:opacity-90',
          isPro
            ? 'bg-[var(--accent-primary)] text-white'
            : 'border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]',
        )}
      >
        {tier.cta}
      </button>

      <ul className="mt-6 space-y-3">
        {FEATURES.map(f => {
          const val = tier.features[f]
          return (
            <li key={f} className="flex items-center gap-2.5 text-[14px]">
              <span className={cn(
                'shrink-0',
                val ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]',
              )}>
                {val ? <Check /> : <Dash />}
              </span>
              <span className={val ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}>
                {typeof val === 'string' ? (
                  <><span className="font-medium">{val}</span> {f.toLowerCase()}</>
                ) : f}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { isLoggedIn, loginWithKeycloak, registerWithKeycloak } = useAuth()
  const { plan, openCheckout } = useBilling()

  const handleUpgrade = (key: Tier['key']) => {
    if (key === 'free') {
      if (isLoggedIn) window.location.href = '/home'
      else registerWithKeycloak()
      return
    }
    if (!isLoggedIn) { registerWithKeycloak(); return }
    if (plan === key) { window.location.href = '/home'; return }
    void openCheckout()
  }

  return (
    <div className="min-h-screen bg-[var(--bg-0)]">
      {/* ── Top nav ── */}
      <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-6">
        <Link href="/" className="text-[15px] font-semibold text-[var(--text-primary)]">
          Inktide
        </Link>
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/home"
              className="rounded-xl bg-[var(--accent-primary)] px-4 py-1.5 text-[14px] font-semibold text-white hover:opacity-90"
            >
              Go to app
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={loginWithKeycloak}
                className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={registerWithKeycloak}
                className="rounded-xl bg-[var(--accent-primary)] px-4 py-1.5 text-[14px] font-semibold text-white hover:opacity-90"
              >
                Sign up free
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">

        {/* ── Header ── */}
        <div className="mb-14 text-center">
          <h1 className="text-[2.5rem] font-bold tracking-[-0.03em] text-[var(--text-primary)]">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-[1.0625rem] text-[var(--text-secondary)]">
            Start free. Upgrade when your soul needs more power.
          </p>
        </div>

        {/* ── Tier cards ── */}
        <div className="grid grid-cols-3 gap-5">
          {TIERS.map(tier => (
            <TierCard key={tier.key} tier={tier} onUpgrade={handleUpgrade} />
          ))}
        </div>

        {/* ── Comparison table ── */}
        <div className="mt-20">
          <h2 className="mb-6 text-center text-[1.125rem] font-semibold text-[var(--text-primary)]">
            Full feature comparison
          </h2>

          <div className="overflow-hidden rounded-2xl border border-[var(--border-card)]">
            {/* Header row */}
            <div className="grid grid-cols-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-3">
              <span className="text-[14px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Feature</span>
              {TIERS.map(t => (
                <span
                  key={t.key}
                  className={cn(
                    'text-center text-[14px] font-semibold uppercase tracking-wider',
                    t.key === 'pro' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]',
                  )}
                >
                  {t.name}
                </span>
              ))}
            </div>

            {FEATURES.map((f, i) => (
              <div
                key={f}
                className={cn(
                  'grid grid-cols-4 px-6 py-3.5',
                  i < FEATURES.length - 1 && 'border-b border-[var(--border-subtle)]',
                  i % 2 === 0 ? 'bg-[var(--surface-card)]' : 'bg-[var(--surface-1)]',
                )}
              >
                <span className="text-[14px] text-[var(--text-secondary)]">{f}</span>
                {TIERS.map(t => {
                  const val = t.features[f]
                  return (
                    <div key={t.key} className="flex justify-center">
                      {typeof val === 'string' ? (
                        <span className="text-[14px] font-medium text-[var(--text-primary)]">{val}</span>
                      ) : val ? (
                        <span className="text-[var(--accent-primary)]"><Check /></span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]"><Dash /></span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="mt-16 text-center">
          <p className="text-[14px] text-[var(--text-tertiary)]">
            Questions? <a href="mailto:hello@inktide.io" className="text-[var(--text-secondary)] underline hover:text-[var(--text-primary)]">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  )
}
