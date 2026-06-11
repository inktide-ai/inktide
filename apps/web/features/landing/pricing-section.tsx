'use client'

import { useMemo } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { HOME_ROUTE, PRICING_ROUTE, checkoutPath } from '@/lib/routes'
import { motion } from 'framer-motion'
import { Shield, RefreshCw, Sparkles, Crown, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fadeUp } from '@/shared/lib/motion'
import PlanCard, { type PlanCardConfig } from './plan-card'
import { sectionContainer } from './section-container'

type PlanKey = 'free' | 'starter' | 'pro'

interface PricingSectionProps {
  plans?: PlanKey[]
  isLoggedIn?: boolean
  registerUrl?: string  // unused, kept for backwards compat
  currentPlan?: string | null
}

const trustItems = [
  { icon: Shield,    titleKey: 'pricing.trust.secureTitle',    descKey: 'pricing.trust.secureDesc',    bgVar: 'var(--pricing-icon-purple-bg)', borderVar: 'var(--pricing-icon-purple-border)', iconColor: 'text-[var(--color-brand-accent)]' },
  { icon: Zap,       titleKey: 'pricing.trust.noCardTitle',    descKey: 'pricing.trust.noCardDesc',    bgVar: 'var(--pricing-icon-orange-bg)', borderVar: 'var(--pricing-icon-orange-border)', iconColor: 'text-[var(--color-brand-orange)]' },
  { icon: RefreshCw, titleKey: 'pricing.trust.cancelTitle',    descKey: 'pricing.trust.cancelDesc',    bgVar: 'var(--pricing-icon-purple-bg)', borderVar: 'var(--pricing-icon-purple-border)', iconColor: 'text-[var(--color-brand-accent)]' },
  { icon: Sparkles,  titleKey: 'pricing.trust.improvingTitle', descKey: 'pricing.trust.improvingDesc', bgVar: 'var(--pricing-icon-orange-bg)', borderVar: 'var(--pricing-icon-orange-border)', iconColor: 'text-[var(--color-brand-orange)]' },
]

export default function PricingSection({
  plans = ['free', 'starter', 'pro'],
  isLoggedIn = false,
  registerUrl: _registerUrl = '',
  currentPlan = null,
}: PricingSectionProps) {
  const router = useRouter()
  const { t } = useTranslation('landing')

  const period = ''

  const goRegister = () => { void signIn('keycloak', { callbackUrl: '/home' }) }

  const handleUpgradeFree = () => {
    if (isLoggedIn) router.push(PRICING_ROUTE)
    else goRegister()
  }

  const handleUpgradeStarter = () => {
    if (!isLoggedIn) { goRegister(); return }
    router.push(checkoutPath('starter', period))
  }

  const handleUpgradePro = () => {
    if (!isLoggedIn) { goRegister(); return }
    if (currentPlan === 'pro') { router.push(HOME_ROUTE); return }
    router.push(checkoutPath('pro', period))
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
      price: '$16',
      perMonthLabel: t('pricing.perMonth'),
      billedLabel: t('pricing.billedMonthly'),
      features: t('pricing.starter.features', { returnObjects: true }) as string[],
      checkBg: '#FF6A2B',
      cta: {
        label: t('pricing.starter.cta'),
        onClick: handleUpgradeStarter,
        variant: 'solid',
        solidStyle: { background: 'var(--brand-gradient-orange)', boxShadow: '0 4px 20px #FF6A2B30' },
      },
    },
    pro: {
      id: 'pro',
      animationIndex: 6,
      icon: Crown,
      iconColor: '#7B61FF',
      name: t('pricing.pro.name'),
      tagline: t('pricing.pro.tagline'),
      price: '$30',
      perMonthLabel: t('pricing.perMonth'),
      billedLabel: t('pricing.billedMonthly'),
      features: t('pricing.pro.features', { returnObjects: true }) as string[],
      checkBg: '#6B5CE7',
      cta: {
        label: t('pricing.pro.cta'),
        onClick: handleUpgradePro,
        variant: 'solid',
        solidStyle: { background: 'var(--brand-gradient-violet)', boxShadow: '0 4px 20px #7B61FF35' },
      },
      highlighted: true,
      popularLabel: t('pricing.mostPopular'),
    },
  }), [t, isLoggedIn, currentPlan]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeCards = plans.map(key => configs[key])
  const gridClass = plans.length === 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  return (
    <section
      id="pricing"
      className="relative overflow-hidden py-12 sm:py-16 md:py-24 transition-[background] duration-[250ms]"
      style={{ backgroundColor: 'var(--bg-dark)' }}
    >
      <div className={cn(sectionContainer, 'relative z-10')}>

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
                style={{ background: 'var(--brand-gradient-violet)', transform: 'rotate(-1.2deg)' }}
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

        {/* Billing cycle */}
        <motion.div
          className="flex justify-center mb-14"
          initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3} variants={fadeUp}
        >
          <p className="text-[13px]" style={{ color: 'var(--pricing-toggle-inactive)' }}>
            Monthly billing · Annual billing coming soon
          </p>
        </motion.div>

        {/* Cards */}
        <div className={gridClass}>
          {activeCards.map(cfg => (
            <PlanCard key={cfg.id} {...cfg} />
          ))}
        </div>

        {/* Bottom trust row */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-10 md:mt-[72px]"
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
                  className="text-xs mt-1 whitespace-pre-line leading-snug transition-[color] duration-[250ms]"
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
