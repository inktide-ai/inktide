'use client'

import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll'
import { cn } from '@/lib/utils'

function CTASection() {
  const { ref, isVisible } = useRevealOnScroll()
  const { registerWithKeycloak } = useAuth()
  const { t } = useTranslation('landing')

  return (
    <section
      id="pricing"
      className="relative mt-20 py-28 px-8 border-t border-[var(--border)] overflow-hidden lg:py-20 lg:px-6 max-md:py-16 max-md:px-4 max-[480px]:py-14"
    >
      <div
        ref={ref}
        className={cn(
          'relative z-[2] max-w-[700px] mx-auto text-center transition-all duration-700',
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        )}
      >
        <button
          type="button"
          className="inline-flex items-center gap-[7px] px-[18px] py-[6px] mb-6 rounded-full text-sm font-semibold cursor-pointer bg-[var(--landing-badge-bg)] [border:0.5px_solid_var(--landing-badge-border)] text-[var(--landing-badge-text)]"
        >
          {t('cta.badge')}
          <span
            className="inline-block w-[22px] h-[22px] flex-shrink-0 bg-current"
            style={{
              maskImage: 'url(/icons/badge-icon.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: 'url(/icons/badge-icon.svg)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
            }}
            aria-hidden
          />
        </button>

        <h2 className="font-['Georgia'] text-[4rem] font-bold tracking-[-0.02em] leading-[1.1] text-[var(--text-primary)] mb-4 max-md:text-[2rem] max-[480px]:text-[1.75rem]">
          Boost d
          <span className="relative inline-block whitespace-nowrap">
            <img
              src="/icons/highlight.svg"
              className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[110%] z-0 pointer-events-none select-none [clip-path:inset(0_0_15%_0)]"
              alt=""
              aria-hidden
            />
            <span className="relative z-[1] italic text-[var(--landing-highlight-text)]">eveloper</span>
          </span>{' '}
          experience
        </h2>

        <p className="text-[1.05rem] text-[var(--hero-subtitle-color)] leading-[1.65] mb-10 max-md:text-base">
          {t('cta.description')}
        </p>

        <button
          type="button"
          onClick={registerWithKeycloak}
          className="py-3.5 px-9 rounded-full text-base font-semibold cursor-pointer transition-[background,transform] duration-200 hover:-translate-y-0.5 bg-[var(--cta-btn-bg)] text-[var(--cta-btn-color)] hover:bg-[var(--cta-btn-hover-bg)]"
        >
          {t('cta.button')}
        </button>
      </div>
    </section>
  )
}

export default CTASection
