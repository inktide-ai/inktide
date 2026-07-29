'use client'

import { useState, useEffect, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronLeft, ExternalLink, Zap } from 'lucide-react'
import { PRICING_ROUTE } from '@/lib/routes'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import type { Appearance } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { apiFetch, jsonOrThrow } from '@/api/client'
import { useBilling } from '@/entities/billing'
import { PLANS, type PlanKey } from '@/shared/data/plans'

const rawKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
const stripePromise = rawKey && !rawKey.includes('REPLACE') ? loadStripe(rawKey) : null

type Method = 'yookassa' | 'card'


interface CardPaymentPanelProps {
  loading: boolean
  setLoading: (v: boolean) => void
}

function CardPaymentPanel({ loading, setLoading }: CardPaymentPanelProps) {
  const { t } = useTranslation('checkout')
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!stripe || !elements) return
    setLoading(true)
    setError('')
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/home?upgraded=1',
      },
    })
    // confirmPayment redirects on success - we only reach here on error
    if (stripeError) setError(stripeError.message ?? t('error.payment'))
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 mb-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !stripe}
        className="w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:opacity-50 bg-white text-black"
      >
        {loading ? t('loading') : t('next')}
      </button>
    </div>
  )
}


function CheckoutContent() {
  const { t } = useTranslation('checkout')
  const router = useRouter()
  const params = useSearchParams()
  const planKey = (params.get('plan') ?? 'starter') as PlanKey
  const plan = PLANS[planKey] ?? PLANS.starter
  const price = plan.monthlyPrice

  const [method, setMethod] = useState<Method>('yookassa')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [fetchingSecret, setFetchingSecret] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(false)
  const [yooError, setYooError] = useState('')
  const { openCheckout } = useBilling()

  const [stripeAppearance, setStripeAppearance] = useState<Appearance>({ theme: 'night' })

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const v = (prop: string, fallback: string) =>
      style.getPropertyValue(prop).trim() || fallback
    setStripeAppearance({
      theme: 'night',
      variables: {
        colorBackground: v('--checkout-stripe-bg',      ''),
        colorText:       v('--checkout-stripe-text',    ''),
        colorDanger:     v('--checkout-stripe-danger',  ''),
        colorPrimary:    v('--checkout-stripe-primary', ''),
        borderRadius:    '12px',
        fontFamily:      'Inter, ui-sans-serif, sans-serif',
      },
    })
  }, [])

  // Fetch clientSecret as soon as user selects card tab
  useEffect(() => {
    if (method !== 'card') {
      setClientSecret(null)
      setFetchError('')
      return
    }
    let cancelled = false
    setFetchingSecret(true)
    setFetchError('')
    apiFetch('/api/billing/stripe/payment-intent', {
      method: 'POST',
      body: JSON.stringify({ plan: planKey, period: 'monthly' }),
    })
      .then(r => jsonOrThrow<{ clientSecret: string }>(r))
      .then(d => { if (!cancelled) setClientSecret(d.clientSecret) })
      .catch(e => { if (!cancelled) setFetchError(e instanceof Error ? e.message : t('error.loading')) })
      .finally(() => { if (!cancelled) setFetchingSecret(false) })
    return () => { cancelled = true }
  }, [method, planKey, t])

  async function handleYooKassaNext() {
    setLoading(true)
    setYooError('')
    try {
      await openCheckout(planKey)
    } catch (e) {
      setYooError(e instanceof Error ? e.message : t('error.payment'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white bg-[var(--checkout-page-bg)]">
      <div className="mx-auto max-w-[1080px] px-8 pt-16 pb-12 flex flex-col lg:flex-row gap-16 items-start">

        <div className="flex-1 min-w-0 w-full lg:max-w-[580px]">

          {/* Back arrow + Title */}
          <button
            type="button"
            onClick={() => router.push(PRICING_ROUTE)}
            className="flex items-center gap-1 mb-8 group"
          >
            <ChevronLeft size={20} className="text-gray-500" />
            <h1 className="font-serif text-[30px] font-medium tracking-tight text-white">
              {t('title')}
            </h1>
          </button>

          {/* Section 1 label */}
          <p className="text-[13px] font-medium mb-3 text-white">{t('paymentMethod')}</p>

          {/* Method tabs */}
          <div className="flex gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => setMethod('yookassa')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 border transition-colors bg-[var(--checkout-surface)]',
                method === 'yookassa' ? 'border-white' : 'border-[var(--checkout-border)]',
              )}
            >
              <img
                src="/images/yookassa.svg"
                alt="ЮKassa"
                style={{ height: 20 }}
              />
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 border transition-colors bg-[var(--checkout-surface)]',
                method === 'card' ? 'border-white' : 'border-[var(--checkout-border)]',
              )}
            >
              <span className="text-body font-medium text-white">{t('card')}</span>
            </button>
          </div>

          {/* Payment panel */}
          {method === 'yookassa' ? (
            <>
              <div className="rounded-xl border border-[var(--checkout-border)] bg-[var(--checkout-surface)] mb-4 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src="/images/yookassa.svg" alt="" style={{ height: 20 }} />
                  <span className="text-body text-white">{t('yookassa.selected')}</span>
                </div>
                <div className="mb-3 border-t border-[var(--checkout-border)]" />
                <div className="flex items-start gap-3">
                  <ExternalLink size={14} className="text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed text-gray-400">
                    {t('yookassa.redirect')}
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed mb-5 text-gray-500">
                {t('yookassa.consent')}
              </p>

              <button
                type="button"
                onClick={handleYooKassaNext}
                disabled={loading}
                className="w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:opacity-50 bg-white text-black"
              >
                {loading ? t('loading') : t('next')}
              </button>

              {yooError && (
                <p className="mt-2 text-xs text-red-500">{yooError}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs leading-relaxed mb-4 text-gray-500">
                {t('cardConsent')}
              </p>

              {fetchError ? (
                <p className="text-[13px] mb-4 text-red-500">{fetchError}</p>
              ) : fetchingSecret || !clientSecret ? (
                <div className="rounded-xl border border-[var(--checkout-border)] bg-[var(--checkout-stripe-bg)] flex items-center justify-center py-10 mb-4 text-[13px] text-gray-500">
                  {t('loadingForm')}
                </div>
              ) : !stripePromise ? (
                <p className="text-sm mb-4 text-red-500">{t('cardUnavailable')}</p>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                  <CardPaymentPanel loading={loading} setLoading={setLoading} />
                </Elements>
              )}
            </>
          )}

          {/* Section 2 - disabled */}
          <div className="mt-6 pt-6 pointer-events-none select-none opacity-35 border-t border-[var(--checkout-border)]">
            <p className="text-[13px] font-medium mb-3 text-white">{t('billingAddress')}</p>
            <div className="rounded-xl border border-[var(--checkout-border)] bg-[var(--checkout-surface)] px-4 py-3 text-[13px] text-gray-500">
              {t('fillStep1')}
            </div>
          </div>
        </div>

        <div className="lg:w-[360px] w-full shrink-0">
          <div className="sticky top-8 rounded-3xl border border-[var(--checkout-border)] bg-[var(--checkout-surface)] p-7">
            <h2 className="font-serif text-[28px] font-medium mb-0.5 text-white">
              {t('plan.title', { name: plan.name })}
            </h2>
            <p className="text-[13px] mb-4 text-gray-500">{t('plan.features')}</p>

            <ul className="space-y-2.5 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-gray-200">
                  <Zap size={13} className="shrink-0" style={{ color: plan.accentColor }} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mb-4 border-t border-[var(--checkout-border)]" />

            <div className="space-y-2 mb-5">
              <div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-gray-300">
                    {t('plan.features')} {t('plan.periodMonthly')}
                  </span>
                  <span className="text-white">{price} €</span>
                </div>
                <p className="text-[11px] mt-0.5 text-gray-500">
                  {t('plan.billingMonthly')}
                </p>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-300">{t('plan.tax')}</span>
                <span className="text-gray-400">0,00 €</span>
              </div>
              <div className="flex justify-between text-body font-semibold pt-2 text-white border-t border-[var(--checkout-border)]">
                <span>{t('plan.dueToday')}</span>
                <span>{price} €</span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full rounded-xl py-3 text-body font-semibold cursor-not-allowed text-gray-500 bg-[var(--checkout-border)]"
            >
              {t('subscribe')}
            </button>

            <p className="mt-3 text-center text-[11px] text-gray-500">
              {t('plan.renewsMonthly', { price })}
            </p>

            <p className="mt-2 text-center text-[11px] text-gray-500">
              Annual billing coming soon
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}
