'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
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
import { PLANS, type PlanKey } from '@/lib/plans'

const rawKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
const stripePromise = rawKey && !rawKey.includes('REPLACE') ? loadStripe(rawKey) : null

type Method = 'robokassa' | 'card'

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
        <p className="text-xs text-red-500">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !stripe}
        className="w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:opacity-50 bg-white text-black"
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

  // Static — checkout has no theme switching. If dark/light toggle is added,
  // pass current theme value as a dep so Stripe appearance re-reads CSS vars.
  const stripeAppearance = useMemo((): Appearance => {
    const style = getComputedStyle(document.documentElement)
    const v = (prop: string, fallback: string) =>
      style.getPropertyValue(prop).trim() || fallback
    return {
      theme: 'night',
      variables: {
        colorBackground: v('--checkout-stripe-bg',      ''),
        colorText:       v('--checkout-stripe-text',    ''),
        colorDanger:     v('--checkout-stripe-danger',  ''),
        colorPrimary:    v('--checkout-stripe-primary', ''),
        borderRadius:    '12px',
        fontFamily:      'Inter, ui-sans-serif, sans-serif',
      },
    }
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
    <div className="min-h-screen text-white bg-[var(--checkout-page-bg)]">
      <div className="mx-auto max-w-[1080px] px-8 pt-16 pb-12 flex flex-col lg:flex-row gap-16 items-start">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 w-full lg:max-w-[580px]">

          {/* Back arrow + Title */}
          <button
            type="button"
            onClick={() => router.push(PRICING_ROUTE)}
            className="flex items-center gap-1 mb-8 group"
          >
            <ChevronLeft size={20} className="text-gray-500" />
            <h1 className="font-serif text-[30px] font-medium tracking-tight text-white">
              Оформление подписки
            </h1>
          </button>

          {/* Section 1 label */}
          <p className="text-[13px] font-medium mb-3 text-white">1. Способ оплаты</p>

          {/* Method tabs */}
          <div className="flex gap-2.5 mb-3">
            <button
              type="button"
              onClick={() => setMethod('robokassa')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 border transition-colors bg-[var(--checkout-surface)]',
                method === 'robokassa' ? 'border-white' : 'border-[var(--checkout-border)]',
              )}
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
              className={cn(
                'flex-1 flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 border transition-colors bg-[var(--checkout-surface)]',
                method === 'card' ? 'border-white' : 'border-[var(--checkout-border)]',
              )}
            >
              <span className="text-body font-medium text-white">Карта</span>
            </button>
          </div>

          {/* Payment panel */}
          {method === 'robokassa' ? (
            <>
              <div className="rounded-xl border border-[var(--checkout-border)] bg-[var(--checkout-surface)] mb-4 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img src="/images/robokassa.svg" alt="" style={{ height: 18, filter: 'invert(1) brightness(10)' }} />
                  <span className="text-body text-white">Выбрана система Robokassa.</span>
                </div>
                <div className="mb-3 border-t border-[var(--checkout-border)]" />
                <div className="flex items-start gap-3">
                  <ExternalLink size={14} className="text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-[13px] leading-relaxed text-gray-400">
                    После отправки вас перенаправят на страницу для безопасного выполнения следующих шагов.
                  </p>
                </div>
              </div>

              <p className="text-xs leading-relaxed mb-5 text-gray-500">
                Подтверждая платёж через Robokassa, вы разрешаете списывать суммы будущих платежей согласно условиям подписки. Отменить можно в любое время.
              </p>

              <button
                type="button"
                onClick={handleRoboNext}
                disabled={loading}
                className="w-full rounded-full py-3 text-[15px] font-semibold transition-colors disabled:opacity-50 bg-white text-black"
              >
                {loading ? 'Загрузка...' : 'Далее'}
              </button>

              {roboError && (
                <p className="mt-2 text-xs text-red-500">{roboError}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs leading-relaxed mb-4 text-gray-500">
                Подтверждая платёж картой, вы разрешаете списывать суммы будущих платежей согласно условиям подписки. Отменить можно в любое время.
              </p>

              {fetchError ? (
                <p className="text-[13px] mb-4 text-red-500">{fetchError}</p>
              ) : fetchingSecret || !clientSecret ? (
                <div className="rounded-xl border border-[var(--checkout-border)] bg-[var(--checkout-stripe-bg)] flex items-center justify-center py-10 mb-4 text-[13px] text-gray-500">
                  Загрузка формы оплаты...
                </div>
              ) : !stripePromise ? (
                <p className="text-sm mb-4 text-red-500">Оплата картой временно недоступна. Обратитесь в поддержку.</p>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: stripeAppearance }}>
                  <CardPaymentPanel loading={loading} setLoading={setLoading} />
                </Elements>
              )}
            </>
          )}

          {/* Section 2 — disabled */}
          <div className="mt-6 pt-6 pointer-events-none select-none opacity-35 border-t border-[var(--checkout-border)]">
            <p className="text-[13px] font-medium mb-3 text-white">2. Платёжный адрес</p>
            <div className="rounded-xl border border-[var(--checkout-border)] bg-[var(--checkout-surface)] px-4 py-3 text-[13px] text-gray-500">
              Заполните шаг 1, чтобы продолжить.
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="lg:w-[360px] w-full shrink-0">
          <div className="sticky top-8 rounded-3xl border border-[var(--checkout-border)] bg-[var(--checkout-surface)] p-7">
            <h2 className="font-serif text-[28px] font-medium mb-0.5 text-white">
              План {plan.name}
            </h2>
            <p className="text-[13px] mb-4 text-gray-500">Основные функции</p>

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
                  <span className="text-gray-300">Подписка {yearly ? 'Ежегодно' : 'Ежемесячно'}</span>
                  <span className="text-white">{price} €</span>
                </div>
                <p className="text-[11px] mt-0.5 text-gray-500">
                  {yearly ? 'Ежегодное' : 'Ежемесячное'} списание в EUR
                </p>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-gray-300">Расчётный налог</span>
                <span className="text-gray-400">0,00 €</span>
              </div>
              <div className="flex justify-between text-body font-semibold pt-2 text-white border-t border-[var(--checkout-border)]">
                <span>К оплате сегодня</span>
                <span>{price} €</span>
              </div>
            </div>

            <button
              type="button"
              disabled
              className="w-full rounded-xl py-3 text-body font-semibold cursor-not-allowed text-gray-500 bg-[var(--checkout-border)]"
            >
              Подписаться
            </button>

            <p className="mt-3 text-center text-[11px] text-gray-500">
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
