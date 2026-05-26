'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChevronLeft, ExternalLink, Zap } from 'lucide-react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { apiFetch, jsonOrThrow } from '@/api/client'
import { useBilling } from '@/features/billing/BillingContext'
import { PLANS, type PlanKey } from '@/lib/plans'

const rawKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
const stripePromise = rawKey && !rawKey.includes('REPLACE') ? loadStripe(rawKey) : null

type Method = 'robokassa' | 'card'

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorBackground: '#141414',
    colorText: '#f9fafb',
    colorDanger: '#ef4444',
    borderRadius: '12px',
    fontFamily: 'Inter, ui-sans-serif, sans-serif',
    colorPrimary: '#ffffff',
  },
}

// ── Card payment panel (must be inside Elements) ─────────────────────────────

interface CardPaymentPanelProps {
  loading: boolean
  setLoading: (v: boolean) => void
}

function CardPaymentPanel({ loading, setLoading }: CardPaymentPanelProps) {
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
    // confirmPayment redirects on success — we only reach here on error
    if (stripeError) setError(stripeError.message ?? 'Ошибка оплаты')
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 mb-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p className="text-[12px]" style={{ color: '#ef4444' }}>{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !stripe}
        className="w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:opacity-50"
        style={{ background: '#fff', color: '#000' }}
      >
        {loading ? 'Загрузка...' : 'Далее'}
      </button>
    </div>
  )
}

// ── Main checkout content ─────────────────────────────────────────────────────

function CheckoutContent() {
  const router = useRouter()
  const params = useSearchParams()
  const planKey = (params.get('plan') ?? 'starter') as PlanKey
  const yearly = params.get('period') === 'yearly'
  const plan = PLANS[planKey] ?? PLANS.starter
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice

  const [method, setMethod] = useState<Method>('robokassa')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [fetchingSecret, setFetchingSecret] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(false)
  const [roboError, setRoboError] = useState('')
  const { openCheckout } = useBilling()

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
      body: JSON.stringify({ plan: planKey, period: yearly ? 'yearly' : 'monthly' }),
    })
      .then(r => jsonOrThrow<{ clientSecret: string }>(r))
      .then(d => { if (!cancelled) setClientSecret(d.clientSecret) })
      .catch(e => { if (!cancelled) setFetchError(e instanceof Error ? e.message : 'Ошибка загрузки') })
      .finally(() => { if (!cancelled) setFetchingSecret(false) })
    return () => { cancelled = true }
  }, [method, planKey, yearly])

  async function handleRoboNext() {
    setLoading(true)
    setRoboError('')
    try {
      await openCheckout(planKey)
    } catch (e) {
      setRoboError(e instanceof Error ? e.message : 'Ошибка оплаты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0A', color: '#fff' }}>
      <div className="mx-auto max-w-[1080px] px-8 pt-16 pb-12 flex flex-col lg:flex-row gap-16 items-start">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 w-full lg:max-w-[580px]">

          {/* Back arrow + Title */}
          <button
            type="button"
            onClick={() => router.push('/pricing')}
            className="flex items-center gap-1 mb-8 group"
          >
            <ChevronLeft size={20} style={{ color: '#6b7280' }} />
            <h1 className="font-serif text-[30px] font-medium tracking-tight" style={{ color: '#fff' }}>
              Оформление подписки
            </h1>
          </button>

          {/* Section 1 label */}
          <p className="text-[13px] font-medium mb-3" style={{ color: '#fff' }}>1. Способ оплаты</p>

          {/* Method tabs */}
          <div className="flex gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => setMethod('robokassa')}
              className="flex-1 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 border transition-colors"
              style={{
                borderColor: method === 'robokassa' ? '#ffffff' : '#2a2a2a',
                background: '#1a1a1a',
              }}
            >
              <img
                src="/images/robokassa.svg"
                alt="Robokassa"
                style={{ height: 14, filter: 'invert(1) brightness(10)' }}
              />
            </button>

            <button
              type="button"
              onClick={() => setMethod('card')}
              className="flex-1 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 border transition-colors"
              style={{
                borderColor: method === 'card' ? '#ffffff' : '#2a2a2a',
                background: '#1a1a1a',
              }}
            >
              <span className="text-[14px] font-medium" style={{ color: '#fff' }}>Карта</span>
            </button>
          </div>

          {/* Payment panel */}
          {method === 'robokassa' ? (
            <>
              <div className="rounded-xl border mb-4 p-4" style={{ borderColor: '#2a2a2a', background: '#1a1a1a' }}>
                <div className="flex items-center gap-3 mb-3">
                  <img src="/images/robokassa.svg" alt="" style={{ height: 18, filter: 'invert(1) brightness(10)' }} />
                  <span className="text-[14px]" style={{ color: '#fff' }}>Выбрана система Robokassa.</span>
                </div>
                <div className="mb-3" style={{ borderTop: '1px solid #2a2a2a' }} />
                <div className="flex items-start gap-3">
                  <ExternalLink size={14} style={{ color: '#6b7280', marginTop: 2, flexShrink: 0 }} />
                  <p className="text-[13px] leading-relaxed" style={{ color: '#9ca3af' }}>
                    После отправки вас перенаправят на страницу для безопасного выполнения следующих шагов.
                  </p>
                </div>
              </div>

              <p className="text-[12px] leading-relaxed mb-5" style={{ color: '#6b7280' }}>
                Подтверждая платёж через Robokassa, вы разрешаете списывать суммы будущих платежей согласно условиям подписки. Отменить можно в любое время.
              </p>

              <button
                type="button"
                onClick={handleRoboNext}
                disabled={loading}
                className="w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:opacity-50"
                style={{ background: '#fff', color: '#000' }}
              >
                {loading ? 'Загрузка...' : 'Далее'}
              </button>

              {roboError && (
                <p className="mt-2 text-[12px]" style={{ color: '#ef4444' }}>{roboError}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-[12px] leading-relaxed mb-4" style={{ color: '#6b7280' }}>
                Подтверждая платёж картой, вы разрешаете списывать суммы будущих платежей согласно условиям подписки. Отменить можно в любое время.
              </p>

              {fetchError ? (
                <p className="text-[13px] mb-4" style={{ color: '#ef4444' }}>{fetchError}</p>
              ) : fetchingSecret || !clientSecret ? (
                <div
                  className="rounded-xl border flex items-center justify-center py-10 mb-4"
                  style={{ borderColor: '#2a2a2a', background: '#141414', color: '#6b7280', fontSize: 13 }}
                >
                  Загрузка формы оплаты...
                </div>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                  <CardPaymentPanel loading={loading} setLoading={setLoading} />
                </Elements>
              )}
            </>
          )}

          {/* Section 2 — disabled */}
          <div
            className="mt-6 pt-6 pointer-events-none select-none"
            style={{ borderTop: '1px solid #2a2a2a', opacity: 0.35 }}
          >
            <p className="text-[13px] font-medium mb-3" style={{ color: '#fff' }}>2. Платёжный адрес</p>
            <div
              className="rounded-xl border px-4 py-3 text-[13px]"
              style={{ borderColor: '#2a2a2a', background: '#1a1a1a', color: '#6b7280' }}
            >
              Заполните шаг 1, чтобы продолжить.
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:w-[360px] w-full shrink-0">
          <div className="sticky top-8 rounded-3xl border p-7" style={{ borderColor: '#2a2a2a', background: '#1a1a1a' }}>
            <h2 className="font-serif text-[28px] font-medium mb-0.5" style={{ color: '#fff' }}>
              План {plan.name}
            </h2>
            <p className="text-[13px] mb-4" style={{ color: '#6b7280' }}>Основные функции</p>

            <ul className="space-y-2.5 mb-5">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-[13px]" style={{ color: '#e5e7eb' }}>
                  <Zap size={13} style={{ color: plan.accentColor, flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mb-4" style={{ borderTop: '1px solid #2a2a2a' }} />

            <div className="space-y-2 mb-5">
              <div>
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: '#d1d5db' }}>Подписка {yearly ? 'Ежегодно' : 'Ежемесячно'}</span>
                  <span style={{ color: '#fff' }}>{price} €</span>
                </div>
                <p className="text-[11px] mt-0.5" style={{ color: '#6b7280' }}>
                  {yearly ? 'Ежегодное' : 'Ежемесячное'} списание в EUR
                </p>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: '#d1d5db' }}>Расчётный налог</span>
                <span style={{ color: '#9ca3af' }}>0,00 €</span>
              </div>
              <div
                className="flex justify-between text-[14px] font-semibold pt-2"
                style={{ borderTop: '1px solid #2a2a2a', color: '#fff' }}
              >
                <span>К оплате сегодня</span>
                <span>{price} €</span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full rounded-xl py-3 text-[14px] font-semibold cursor-not-allowed"
              style={{ background: '#2a2a2a', color: '#6b7280' }}
            >
              Подписаться
            </button>

            <p className="mt-3 text-center text-[11px]" style={{ color: '#6b7280' }}>
              Подписка продлевается {yearly ? 'ежегодно' : 'ежемесячно'} до отмены.{' '}
              Будет списано {price} €/{yearly ? 'год' : 'мес'} (включая налоги).
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
