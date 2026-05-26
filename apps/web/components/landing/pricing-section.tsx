'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Shield, RefreshCw, Sparkles, Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/lib/motion'
import { useAuth } from '@/context/AuthContext'
import { useBilling } from '@/context/BillingContext'
import PlanCard, { type PlanCardConfig } from './plan-card'

type PlanKey = 'free' | 'starter' | 'pro'

interface PricingSectionProps {
  plans?: PlanKey[]
}

const trustItems = [
  { icon: Shield,    titleKey: 'pricing.trust.secureTitle',    descKey: 'pricing.trust.secureDesc',    bgVar: 'var(--pricing-icon-purple-bg)', borderVar: 'var(--pricing-icon-purple-border)', iconColor: 'text-[#7B61FF]' },
  { icon: Zap,       titleKey: 'pricing.trust.noCardTitle',    descKey: 'pricing.trust.noCardDesc',    bgVar: 'var(--pricing-icon-orange-bg)', borderVar: 'var(--pricing-icon-orange-border)', iconColor: 'text-[#FF8C2B]' },
  { icon: RefreshCw, titleKey: 'pricing.trust.cancelTitle',    descKey: 'pricing.trust.cancelDesc',    bgVar: 'var(--pricing-icon-purple-bg)', borderVar: 'var(--pricing-icon-purple-border)', iconColor: 'text-[#7B61FF]' },
  { icon: Sparkles,  titleKey: 'pricing.trust.improvingTitle', descKey: 'pricing.trust.improvingDesc', bgVar: 'var(--pricing-icon-orange-bg)', borderVar: 'var(--pricing-icon-orange-border)', iconColor: 'text-[#FF6B2B]' },
]

export default function PricingSection({ plans = ['free', 'starter', 'pro'] }: PricingSectionProps) {
  const [yearly, setYearly] = useState(false)
  const router = useRouter()
  const { t } = useTranslation('landing')
  const { isLoggedIn, registerWithKeycloak } = useAuth()
  const { plan } = useBilling()

  const period = yearly ? '&period=yearly' : ''

  const handleUpgradeFree = () => {
    if (isLoggedIn) router.push('/pricing')
    else registerWithKeycloak()
  }

  const handleUpgradeStarter = () => {
    if (!isLoggedIn) { registerWithKeycloak(); return }
    router.push(`/checkout?plan=starter${period}`)
  }

  const handleUpgradePro = () => {
    if (!isLoggedIn) { registerWithKeycloak(); return }
    if (plan === 'pro') { router.push('/home'); return }
    router.push(`/checkout?plan=pro${period}`)
  }

  const configs = useMemo<Record<PlanKey, PlanCardConfig>>(() => ({
    free: {
      id: 'free',
      animationIndex: 4,
      icon: Sparkles,
      iconColor: '#7B61FF',
      name: t('pricing.free.name'),
      tagline: t('pricing.free.tagline'),
      price: t('pricing.free.price'),
      perMonthLabel: t('pricing.perMonth'),
      features: t('pricing.free.features', { returnObjects: true }) as string[],
      checkBg: '#5B56F0',
      cta: {
        label: t('pricing.free.cta'),
        onClick: handleUpgradeFree,
        variant: 'outline',
      },
    },
    starter: {
      id: 'starter',
      animationIndex: 5,
      icon: Zap,
      iconColor: '#FF6A2B',
      name: t('pricing.starter.name'),
      tagline: t('pricing.starter.tagline'),
      price: `$${yearly ? 12 : 16}`,
      perMonthLabel: t('pricing.perMonth'),
      billedLabel: yearly ? t('pricing.billedYearlyStarter') : t('pricing.billedMonthly'),
      features: t('pricing.starter.features', { returnObjects: true }) as string[],
      checkBg: '#FF6A2B',
      cta: {
        label: t('pricing.starter.cta'),
        onClick: handleUpgradeStarter,
        variant: 'solid',
        solidStyle: { background: 'linear-gradient(135deg, #FF6A2B, #E84E00)', boxShadow: '0 4px 20px #FF6A2B30' },
      },
    },
    pro: {
      id: 'pro',
      animationIndex: 6,
      icon: Crown,
      iconColor: '#7B61FF',
      name: t('pricing.pro.name'),
      tagline: t('pricing.pro.tagline'),
      price: `$${yearly ? 24 : 30}`,
      perMonthLabel: t('pricing.perMonth'),
      billedLabel: yearly ? t('pricing.billedYearlyPro') : t('pricing.billedMonthly'),
      features: t('pricing.pro.features', { returnObjects: true }) as string[],
      checkBg: '#6B5CE7',
      cta: {
        label: t('pricing.pro.cta'),
        onClick: handleUpgradePro,
        variant: 'solid',
        solidStyle: { background: 'linear-gradient(135deg, #6B5CE7, #5046CC)', boxShadow: '0 4px 20px #7B61FF35' },
      },
      highlighted: true,
      popularLabel: t('pricing.mostPopular'),
    },
  }), [yearly, t, isLoggedIn, plan]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeCards = plans.map(key => configs[key])
  const gridClass = plans.length === 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-24 px-6 transition-[background] duration-[250ms]"
      style={{ backgroundColor: 'var(--bg-dark)' }}
    >
      <div className="relative z-10 mx-auto max-w-6xl">

        {/* Badge */}
        <motion.div
          className="flex justify-center mb-7"
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} variants={fadeUp}
        >
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-[7px] text-[13px] backdrop-blur-sm transition-[background,border-color,color] duration-[250ms]"
            style={{
              border: '1px solid var(--pricing-badge-border)',
              background: 'var(--pricing-badge-bg)',
              color: 'var(--pricing-badge-color)',
            }}
          >
            {t('pricing.badge')}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          className="relative text-center mb-5"
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} variants={fadeUp}
        >
          <h2
            className="font-serif text-[3.2rem] md:text-[4.25rem] font-extrabold tracking-[-0.03em] leading-[1.1] transition-[color] duration-[250ms]"
            style={{ color: 'var(--pricing-title)' }}
          >
            {t('pricing.heading')}{' '}
            <span className="relative inline-block">
              <span
                className="absolute inset-x-[-6px] inset-y-[-2px] rounded-xl z-0"
                style={{ background: 'linear-gradient(135deg, #5B4FCC, #7B61FF)', transform: 'rotate(-1.2deg)' }}
              />
              <span className="relative z-10 px-1 text-white">{t('pricing.headingAccent')}</span>
              <img
                src="/images/asterisk.svg"
                alt=""
                aria-hidden
                className="absolute -top-6 hidden md:block"
                style={{ right: 'calc(var(--spacing) * -18)' }}
                width={56}
                height={53}
              />
              <img
                src="/images/arrow-down-left.svg"
                alt=""
                aria-hidden
                className="absolute -right-12 top-[80%] hidden md:block"
                width={32}
                height={77}
              />
            </span>
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-center text-[1.0625rem] mb-11 transition-[color] duration-[250ms]"
          style={{ color: 'var(--pricing-subtitle)' }}
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} variants={fadeUp}
        >
          {t('pricing.subtitle')}
        </motion.p>

        {/* Toggle */}
        <motion.div
          className="relative flex justify-center mb-14"
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp}
        >
          <img
            src="/images/arrow-down-right.svg"
            alt=""
            aria-hidden
            className="absolute -bottom-8 left-[calc(50%-230px)] hidden md:block"
            width={50}
            height={44}
          />
          <div
            className="relative inline-flex items-center rounded-full p-1 gap-0.5 transition-[background,border-color] duration-[250ms]"
            style={{
              border: '1px solid var(--pricing-toggle-border)',
              background: 'var(--pricing-toggle-bg)',
            }}
          >
            <button
              type="button"
              aria-pressed={!yearly}
              onClick={() => setYearly(false)}
              className="rounded-full px-5 py-2 text-[13.5px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{
                background: !yearly ? 'var(--pricing-toggle-active-bg)' : 'transparent',
                color: !yearly ? 'var(--pricing-toggle-active-color)' : 'var(--pricing-toggle-inactive)',
              }}
            >
              {t('pricing.monthly')}
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setYearly(true)}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-[13.5px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
              style={{
                background: yearly ? 'var(--pricing-toggle-active-bg)' : 'transparent',
                color: yearly ? 'var(--pricing-toggle-active-color)' : 'var(--pricing-toggle-inactive)',
              }}
            >
              {t('pricing.yearly')}
              <span className="rounded-full bg-[#7B61FF]/25 border border-[#7B61FF]/35 px-2 py-[2px] text-[11px] font-semibold text-[#A896FF]">
                {t('pricing.savePercent')}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <div className={gridClass}>
          {activeCards.map(cfg => (
            <PlanCard key={cfg.id} {...cfg} />
          ))}
        </div>

        {/* Bottom trust row */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-[72px]"
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={8} variants={fadeUp}
        >
          {trustItems.map(({ icon: Icon, titleKey, descKey, bgVar, borderVar, iconColor }) => (
            <div key={titleKey} className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 transition-[background,border-color] duration-[250ms]"
                style={{ background: bgVar, border: `1px solid ${borderVar}` }}
              >
                <Icon className={cn('w-[18px] h-[18px]', iconColor)} />
              </div>
              <div>
                <p
                  className="text-[13.5px] font-semibold transition-[color] duration-[250ms]"
                  style={{ color: 'var(--pricing-trust-title)' }}
                >
                  {t(titleKey)}
                </p>
                <p
                  className="text-[12px] mt-1 whitespace-pre-line leading-snug transition-[color] duration-[250ms]"
                  style={{ color: 'var(--pricing-trust-desc)' }}
                >
                  {t(descKey)}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
