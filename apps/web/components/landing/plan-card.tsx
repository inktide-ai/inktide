'use client'

import type { CSSProperties } from 'react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { fadeUp } from '@/lib/motion'

export interface PlanCardConfig {
  id: string
  animationIndex: number
  icon: LucideIcon
  iconColor: string
  name: string
  tagline: string
  price: string
  perMonthLabel: string
  billedLabel?: string
  features: string[]
  checkBg: string
  cta: {
    label: string
    onClick: () => void
    variant: 'outline' | 'solid'
    solidStyle?: CSSProperties
  }
  highlighted?: boolean
  popularLabel?: string
}

export default function PlanCard(cfg: PlanCardConfig) {
  const {
    animationIndex, icon: Icon, iconColor, name, tagline,
    price, perMonthLabel, billedLabel, features, checkBg,
    cta, highlighted, popularLabel,
  } = cfg

  const inner = (
    <>
      <div className="mb-3">
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <h3
        className="font-serif text-[1.75rem] font-bold tracking-tight transition-[color] duration-[250ms]"
        style={{ color: 'var(--pricing-title)' }}
      >
        {name}
      </h3>
      <p className="text-[13.5px] mt-0.5 mb-5 transition-[color] duration-[250ms]" style={{ color: 'var(--pricing-subtitle)' }}>
        {tagline}
      </p>

      <div className="flex items-end gap-1 mb-1">
        <span
          className="font-serif text-[2.75rem] font-extrabold leading-none tracking-tight transition-[color] duration-[250ms]"
          style={{ color: 'var(--pricing-price)' }}
        >
          {price}
        </span>
        <span className="text-[13.5px] mb-2 transition-[color] duration-[250ms]" style={{ color: 'var(--pricing-price-muted)' }}>
          {perMonthLabel}
        </span>
      </div>
      {billedLabel
        ? <p className="text-[12.5px] mb-6 transition-[color] duration-[250ms]" style={{ color: 'var(--pricing-billing)' }}>{billedLabel}</p>
        : <div className="h-[18px] mb-6" />
      }

      <ul className="space-y-3 flex-1 mb-8">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2.5 text-[13.5px] transition-[color] duration-[250ms]" style={{ color: 'var(--pricing-feature)' }}>
            <span
              className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
              style={{ background: checkBg }}
            >
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </span>
            {f}
          </li>
        ))}
      </ul>

      {cta.variant === 'outline' ? (
        <button
          type="button"
          onClick={cta.onClick}
          className="w-full rounded-xl py-[11px] text-[14px] font-semibold transition-all duration-[250ms] hover:bg-[var(--pricing-btn-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          style={{ border: '1px solid var(--pricing-btn-border)', color: 'var(--pricing-btn-color)', background: 'transparent' }}
        >
          {cta.label}
        </button>
      ) : (
        <button
          type="button"
          onClick={cta.onClick}
          className="w-full rounded-xl py-[11px] text-[14px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
          style={cta.solidStyle}
        >
          {cta.label}
        </button>
      )}
    </>
  )

  if (highlighted) {
    return (
      <motion.div
        className="relative flex flex-col rounded-2xl p-px overflow-visible"
        style={{ background: 'linear-gradient(140deg, #7B61FF90, #4A3DC860, #7B61FF70)' }}
        initial="hidden" whileInView="visible" viewport={{ once: true }} custom={animationIndex} variants={fadeUp}
        whileHover={{ y: -5, transition: { duration: 0.2, ease: 'easeOut' } }}
      >
        {popularLabel && (
          <div className="absolute -top-[14px] left-1/2 -translate-x-1/2 z-20">
            <span className="rounded-full bg-[#7B61FF] px-3.5 py-[5px] text-[11.5px] font-semibold text-white shadow-[0_4px_16px_#7B61FF40] whitespace-nowrap">
              {popularLabel}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute -inset-px rounded-2xl shadow-[0_0_40px_#7B61FF25]" />
        <div
          className="relative rounded-[15px] p-6 flex flex-col h-full transition-[background] duration-[250ms]"
          style={{ background: 'var(--pricing-pro-card-bg)' }}
        >
          {inner}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl p-6 transition-[background,border-color,box-shadow] duration-[250ms]"
      style={{
        background: 'var(--pricing-card-bg)',
        border: '1px solid var(--pricing-card-border)',
        boxShadow: 'var(--pricing-card-shadow)',
      }}
      initial="hidden" whileInView="visible" viewport={{ once: true }} custom={animationIndex} variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
    >
      {inner}
    </motion.div>
  )
}
