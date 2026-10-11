'use client'

import { useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Shield, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import type { PriceLabels } from '@/entities/billing/lib/price-labels'
import { HOME_ROUTE, checkoutPath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { Corners, EASE, RevealLine, digits, display, hatch, mono } from './broadcast'

// Pricing as a scene of the stream: each plan is a VHS tape in its sleeve, after the
// tapes on ZZZ's world page. Picking a plan pulls its tape up out of the sleeve.

type PlanKey = 'free' | 'starter' | 'pro'

const PLANS: PlanKey[] = ['free', 'starter', 'pro']

// The top-right corner is cut off, the way ZZZ cuts its panels.
const CHAMFER = 'polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 0 100%)'

// The cover art sits in the lower right of the sleeve's top, cut on the diagonal.
const ART_CUT = 'polygon(78% 0, 100% 0, 100% 100%, 22% 100%)'

// Quackie wears a different costume on each tape; the colour of its backdrop is the
// colour of the tape's label and of the plan's button.
const TAPES: Record<PlanKey, { art: string; backdrop: string; label: string; bullet: string; button: string }> = {
  free: {
    art: '/images/landing/chat/still-laugh.png',
    backdrop: 'bg-[#2A3040]',
    label: 'bg-[#323948] text-[var(--q-cream)]',
    bullet: 'bg-[var(--q-cream-dim)]',
    button: 'ring-1 ring-inset ring-[var(--q-cream)] text-[var(--q-cream)] hover:bg-[var(--q-cream)] hover:text-[var(--q-bg)]',
  },
  starter: {
    art: '/images/landing/costumes/still-raccoon.png',
    backdrop: 'bg-[var(--q-cream)]',
    label: 'bg-[var(--q-cream)] text-[var(--q-bg)]',
    bullet: 'bg-[var(--q-cream)]',
    button: 'bg-[var(--q-cream)] text-[var(--q-bg)] hover:-translate-y-0.5',
  },
  pro: {
    art: '/images/landing/costumes/still-shark.png',
    backdrop: 'bg-[var(--q-duck)]',
    label: 'bg-[var(--q-duck)] text-[var(--q-bg)]',
    bullet: 'bg-[var(--q-duck)]',
    button: 'bg-[var(--q-duck)] text-[var(--q-bg)] hover:-translate-y-0.5',
  },
}

const TRUST: { icon: LucideIcon; key: string }[] = [
  { icon: Shield, key: 'secure' },
  { icon: Zap, key: 'noCard' },
  { icon: RefreshCw, key: 'cancel' },
  { icon: Sparkles, key: 'improving' },
]

export interface PlansSceneProps {
  /** From fetchPriceLabels(); null when the billing API is unreachable. */
  prices: PriceLabels | null
  isLoggedIn: boolean
  currentPlan?: string | null
}

export default function PlansScene({ prices, isLoggedIn, currentPlan = null }: PlansSceneProps) {
  const { t } = useTranslation('landing')
  const router = useRouter()
  const reduceMotion = useReducedMotion() ?? false
  // One tape is out at a time, as on ZZZ: Pro until another plan is pointed at or focused.
  const [open, setOpen] = useState<PlanKey>('pro')

  const choose = (plan: PlanKey) => {
    if (!isLoggedIn) return void signIn('keycloak', { callbackUrl: HOME_ROUTE })
    if (plan === 'free' || plan === currentPlan) return router.push(HOME_ROUTE)
    router.push(checkoutPath(plan, ''))
  }

  return (
    <section
      id="plans"
      aria-labelledby="plans-title"
      style={{ '--u': 'min(1vw, 1.7778svh)' } as CSSProperties}
      className="relative isolate overflow-hidden bg-[var(--q-bg)] pb-[16vh] pt-[calc(56px+9vh)] text-[var(--q-cream)]"
    >
      <Corners topClassName="top-[72px] sm:top-[calc(3.2vh+56px)]" />

      {/* The road the plans stand on, rising to the right like the landing's track. */}
      <div
        aria-hidden
        style={{ ...hatch, clipPath: 'polygon(0 22%, 100% 0, 100% 100%, 0 100%)' }}
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[64%]"
      />

      <div className="px-4 sm:px-[6.5vw]">
        <div className="relative">
          {/* The yellow plate with the scene number, as the landing labels its sections. It hangs
              from the top of the page and ends with the heading, so it never runs under the plans. */}
          <div
            aria-hidden
            style={{ clipPath: 'polygon(34% 0, 100% 0, 100% 100%, 0 100%)' }}
            className="pointer-events-none absolute -right-[6.5vw] -top-[calc(56px+9vh)] bottom-[-3vh] -z-10 hidden w-[25vw] bg-[var(--q-duck)] lg:block"
          >
            <div className="absolute bottom-[10%] left-[24%] text-[var(--q-bg)]">
              <div style={{ ...display, textShadow: 'none', fontStretch: '84%' }} className="text-[calc(var(--u)*2.6)] uppercase">
                Plans
              </div>
              <div style={digits} className="origin-bottom-left -skew-x-[11deg] text-[calc(var(--u)*9)]">
                05
              </div>
            </div>
          </div>

          <span className={cn(mono, 'inline-block -skew-x-12 bg-[var(--q-cream)] px-2 py-0.5 text-[12px] uppercase tracking-[0.14em] text-[var(--q-bg)]')}>
            {t('pricing.badge')}
          </span>

          <h1 id="plans-title" style={display} className="mt-5 max-w-[16ch] text-[clamp(48px,6.6vw,124px)] uppercase">
            <RevealLine delay={0.1}>{t('pricing.heading')}</RevealLine>
            <RevealLine delay={0.2}>
              <span className="text-[var(--q-duck)]">{t('pricing.headingAccent')}</span>
            </RevealLine>
          </h1>

          <p className="mt-6 max-w-[42ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-[var(--q-cream-dim)]">
            {t('pricing.subtitle')}
          </p>
        </div>

        <ol className="mt-[7vh] grid gap-7 lg:grid-cols-3 lg:gap-[2vw]">
          {PLANS.map((plan, i) => {
            const tape = TAPES[plan]
            const name = t(`pricing.${plan}.name`)
            const features = t(`pricing.${plan}.features`, { returnObjects: true }) as string[]
            return (
              <motion.li
                key={plan}
                initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: EASE }}
                data-open={open === plan}
                onPointerEnter={() => setOpen(plan)}
                onFocus={() => setOpen(plan)}
                // The top padding is the room the tape is pulled up into.
                className="group relative pt-32"
              >
                <div className="relative h-full">
                  <Cassette name={name} label={tape.label} />

                  {/* The hard offset shadow is a solid copy of the sleeve rather than a drop-shadow
                      filter, which Chrome tiles on tall elements and leaves gaps in. */}
                  <div aria-hidden style={{ clipPath: CHAMFER }} className="absolute inset-0 z-10 -translate-x-2.5 translate-y-2.5 bg-[#050608]" />
                  {plan === 'pro' && (
                    <span className={cn(mono, 'absolute left-7 top-0 z-30 -translate-y-1/2 -skew-x-12 bg-[var(--q-duck)] px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--q-bg)] xl:left-9')}>
                      {t('pricing.mostPopular')}
                    </span>
                  )}

                  {/* Every row keeps the same height on all three sleeves, so they line up side by side. */}
                  <div style={{ clipPath: CHAMFER }} className="relative z-20 flex h-full flex-col bg-[#0A0C11] text-[var(--q-cream)]">
                    {/* The cover: the plan's name, and Quackie in this tape's costume on the diagonal. */}
                    <div className="relative h-[clamp(220px,17vw,270px)] px-7 pt-7 xl:px-9 xl:pt-9">
                      <div aria-hidden style={{ clipPath: ART_CUT }} className={cn('absolute inset-0 overflow-hidden', tape.backdrop)}>
                        <Image
                          src={tape.art}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 34vw, 100vw"
                          // Quackie's face sits left of centre in the still; moving the frame right
                          // keeps it in the wide part of the cut instead of on the diagonal.
                          className="translate-x-[22%] object-cover object-[70%_0%]"
                        />
                      </div>
                      <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full">
                        {[4, 8].map(d => (
                          <line key={d} x1={78 + d} y1={0} x2={22 + d} y2={100} stroke="#0A0C11" strokeWidth={3} vectorEffect="non-scaling-stroke" />
                        ))}
                      </svg>

                      <span className={cn(mono, 'relative block min-h-[2.8em] max-w-[72%] text-[12px] uppercase leading-[1.4] tracking-[0.14em] opacity-70')}>
                        {String(i + 1).padStart(2, '0')} · {t(`pricing.${plan}.tagline`)}
                      </span>
                      <h2 style={display} className="relative mt-4 text-[clamp(44px,3.6vw,64px)] uppercase">
                        {name}
                      </h2>
                    </div>

                    <div className="flex flex-1 flex-col px-7 pb-7 xl:px-9 xl:pb-9">
                      <div className="mt-6 flex items-end gap-2">
                        <span style={digits} className="origin-bottom-left -skew-x-[11deg] whitespace-nowrap text-[clamp(40px,3.4vw,60px)]">
                          {prices?.[plan] ?? '—'}
                        </span>
                        <span className={cn(mono, 'mb-1.5 text-[14px] opacity-70')}>{t('pricing.perMonth')}</span>
                      </div>
                      {/* Free bills nothing, but keeps the line so its features start level with the others. */}
                      <p
                        aria-hidden={plan === 'free' || undefined}
                        className={cn(mono, 'mt-2 text-[12px] uppercase tracking-[0.1em] opacity-60', plan === 'free' && 'invisible')}
                      >
                        {t('pricing.billedMonthly')}
                      </p>

                      <ul className="mt-7 grid gap-3 pb-9 text-[15px] leading-snug">
                        {features.map(feature => (
                          <li key={feature} className="flex items-start gap-3">
                            <span aria-hidden className={cn('mt-[7px] size-2 shrink-0 rotate-45', tape.bullet)} />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        onClick={() => choose(plan)}
                        className={cn(
                          mono,
                          'mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[14px] font-semibold uppercase tracking-[0.08em]',
                          'transition-[transform,background-color,color] duration-200',
                          tape.button,
                        )}
                      >
                        {t(`pricing.${plan}.cta`)}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.li>
            )
          })}
        </ol>

        <ul className="mt-[9vh] grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-start gap-3">
              <Icon aria-hidden className="mt-0.5 size-[18px] shrink-0 text-[var(--q-duck)]" strokeWidth={2.2} />
              <div>
                <p className={cn(mono, 'text-[12px] uppercase tracking-[0.14em]')}>{t(`pricing.trust.${key}Title`)}</p>
                <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-[var(--q-cream-dim)]">
                  {t(`pricing.trust.${key}Desc`)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The tape behind the sleeve. It waits inside, just below the sleeve's top edge, until its
 *  plan is picked; then it slides up out of the sleeve and its reels give one turn. */
function Cassette({ name, label }: { name: string; label: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute left-1/2 top-0 z-[5] w-[78%] -translate-x-1/2 translate-y-[6%]',
        'transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open=true]:-translate-y-[72%]',
        'motion-reduce:transition-none',
      )}
    >
      <div className="aspect-[1.8] rounded-[10px] bg-[#252A35] p-[4.5%] ring-1 ring-inset ring-[rgb(255_255_255/0.06)]">
        <div className={cn('flex h-[40%] items-center justify-between gap-3 rounded-[6px] px-[6%]', label)}>
          <span style={{ ...display, textShadow: 'none' }} className="truncate text-[clamp(22px,2vw,32px)] uppercase">
            {name}
          </span>
          <span className={cn(mono, 'shrink-0 text-[11px] uppercase tracking-[0.14em] opacity-70')}>SP · T-30</span>
        </div>
        <div className="mx-[12%] mt-[5%] flex h-[42%] items-center justify-between rounded-[6px] bg-[#0B0D12] px-[7%]">
          <Reel />
          <Reel />
        </div>
      </div>
    </div>
  )
}

function Reel() {
  return (
    <span
      className={cn(
        'grid aspect-square h-[78%] place-items-center rounded-full',
        'bg-[repeating-conic-gradient(#3A4150_0_18deg,#2A303C_18deg_60deg)]',
        'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open=true]:rotate-[200deg]',
        'motion-reduce:transition-none',
      )}
    >
      <span className="size-[34%] rounded-full bg-[#0B0D12] ring-2 ring-[#3A4150]" />
    </span>
  )
}
