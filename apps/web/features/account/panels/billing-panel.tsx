'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Crown, Zap, Sparkles, Check, ExternalLink, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBilling } from '@/entities/billing/context/BillingContext'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { fetchStorageUsage } from '@/api/storage'
import { queryKeys } from '@/shared/lib/query/keys'
import { PLAN_LIMITS } from '@/shared/lib/plan-limits'
import { checkoutPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const PLAN_ORDER: Record<string, number> = { free: 0, starter: 1, pro: 2 }

const PLAN_META: Record<string, { icon: LucideIcon; iconColor: string; tagline: string; price: string; popular?: boolean }> = {
  free:    { icon: Sparkles, iconColor: '#7B61FF', tagline: 'For curious minds',  price: '€0'                },
  starter: { icon: Zap,      iconColor: '#FF6A2B', tagline: 'For early builders', price: '€9'                },
  pro:     { icon: Crown,    iconColor: '#E8A020', tagline: 'For power users',    price: '€19', popular: true },
}

const PLANS = ['free', 'starter', 'pro'] as const

const FEATURE_HEADER: Record<string, string> = {
  free:    'Includes',
  starter: 'Everything in Free',
  pro:     'Everything in Starter',
}

function Meter({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-1.5 w-full rounded-full bg-[var(--surface-3)]">
      <div className="h-full rounded-full bg-[var(--accent-hover)]" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function BillingPanel() {
  const { t } = useTranslation('landing')
  const router = useRouter()
  const { plan, periodEnd, isLoading: billingLoading, openPortal } = useBilling()
  const { cardList, loading: cardsLoading } = useCharactersContext()
  const { data: storageUsage } = useQuery({
    queryKey: queryKeys.me.storage,
    queryFn: fetchStorageUsage,
    staleTime: 60_000,
  })

  if (billingLoading || cardsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-[140px] animate-pulse rounded-xl bg-[var(--surface-2)]" />
        <div className="mt-4 h-5 w-40 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-[220px] animate-pulse rounded-xl bg-[var(--surface-2)]" />
      </div>
    )
  }

  const meta = PLAN_META[plan]
  const limits = PLAN_LIMITS[plan]
  const charsMax = limits.maxSoulCards === Infinity ? null : limits.maxSoulCards
  const storageUsedGb = storageUsage?.usedGb ?? 0
  const storageMaxGb = storageUsage?.maxGb ?? (plan === 'pro' ? 10 : plan === 'starter' ? 5 : 1)
  const currentPlanIndex = PLAN_ORDER[plan]

  const features = Object.fromEntries(
    PLANS.map((p) => [p, (t(`pricing.${p}.features`, { returnObjects: true }) as string[]) ?? []])
  )

  return (
    <div className="space-y-9">

      <div>
        <p className="mb-3 text-[17px] font-semibold text-[var(--text-primary)]">Your current plan</p>

        <div className="rounded-xl bg-[var(--surface-1)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <meta.icon size={20} style={{ color: meta.iconColor }} />
                <span className="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                </span>
              </div>
              <p className="text-[14px] text-[var(--text-secondary)]">{meta.tagline}</p>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {periodEnd && (
                <p className="text-body text-[var(--text-tertiary)]">
                  Renews {periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {plan === 'pro' ? (
                <button
                  type="button"
                  onClick={() => void openPortal()}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-1.5 text-body font-medium text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors"
                >
                  <ExternalLink size={13} />
                  Manage subscription
                </button>
              ) : (
                <span className="rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)]/20 px-2.5 py-0.5 text-[12px] font-medium text-[var(--accent-primary)]">
                  Current plan
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <div className="mb-1.5 flex justify-between text-body text-[var(--text-secondary)]">
                <span>Souls</span>
                <span>{cardList.length} / {charsMax ?? '∞'}</span>
              </div>
              {charsMax !== null && <Meter value={cardList.length} max={charsMax} />}
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-body text-[var(--text-secondary)]">
                <span>Storage</span>
                <span>{storageUsedGb} / {storageMaxGb} GB</span>
              </div>
              <Meter value={storageUsedGb} max={storageMaxGb} />
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[17px] font-semibold text-[var(--text-primary)]">Compare all plans</p>
        <div className="h-px bg-[var(--border-subtle)]" />

        {/* Sticky plan header */}
        <div className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] pb-4 pt-5 shadow-[0_2px_4px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2">
            <div />
            {PLANS.map((p) => {
              const m = PLAN_META[p]
              const isCurrent = plan === p
              const isUpgrade = PLAN_ORDER[p] > currentPlanIndex
              return (
                <div key={p} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[22px] font-semibold leading-none text-[var(--text-primary)]">
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </span>
                    {m.popular && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent-primary)]">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-tight text-[var(--text-secondary)]">{m.price}/mo</p>

                  {isCurrent ? (
                    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-center text-body font-medium text-[var(--text-secondary)]">
                      Current plan
                    </div>
                  ) : isUpgrade ? (
                    <button
                      type="button"
                      onClick={() => router.push(checkoutPath(p, ''))}
                      className={cn(
                        'rounded-lg px-2 py-1 text-body font-semibold transition-colors',
                        p === 'pro'
                          ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
                          : 'border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]',
                      )}
                    >
                      Upgrade
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {/* Highlights */}
        <div className="rounded-b-xl bg-[var(--surface-1)]/50 py-4">
          <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2">
            <div className="flex items-start pt-1">
              <span className="text-[12px] font-medium text-[var(--text-tertiary)]">Highlights</span>
            </div>
            {PLANS.map((p) => (
              <div
                key={p}
                className={cn(
                  'rounded-lg px-3 py-3',
                  plan === p && 'border border-[var(--accent-soft)]/40 bg-[var(--accent-soft)]/10',
                )}
              >
                <p className="mb-2 text-[12px] font-semibold text-[var(--text-primary)]">
                  {FEATURE_HEADER[p]}
                </p>
                <ul className="space-y-1.5">
                  {((features[p] as string[]) || []).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[12px] leading-snug text-[var(--text-primary)]">
                      <Check size={12} className="mt-0.5 shrink-0 text-[var(--accent-primary)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
