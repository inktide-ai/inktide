'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const WindowsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 42 43" fill="none">
    <path d="M20.02 11.8816V21.0616c0 .11.09.2.2.2h12.59c.11 0 .2-.09.2-.2V10.0416c0-.06-.02-.11-.07-.15-.04-.04-.1-.05-.16-.05L20.19 11.6716c-.1.01-.17.1-.17.19v.02Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M18.64 31.8815c.09-.02.13-.04.17-.07.04-.04.07-.09.07-.15V22.6315c0-.11-.09-.2-.2-.2H9.2c-.05 0-.1.02-.14.06-.04.04-.06.09-.06.14v7.75c0 .1.07.18.17.19l9.44 1.29h.02Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M9.21 21.2616H18.64c.11 0 .2-.09.2-.2v-8.96c0-.06-.02-.11-.07-.15-.04-.04-.1-.05-.16-.05L9.17 13.1816c-.1.01-.17.1-.17.19v7.67c0 .11.1.2.21.2Z" fill="currentColor" fillOpacity="0.85"/>
    <path d="M32.8 33.8515c.09-.02.13-.04.17-.07.04-.04.07-.09.07-.15V22.6315c0-.05-.02-.1-.05-.14-.04-.04-.09-.06-.14-.06H20.22c-.11 0-.2.09-.2.2v9.25c0 .1.07.18.17.19l12.59 1.77h.02Z" fill="currentColor" fillOpacity="0.85"/>
  </svg>
)

const MacIcon = () => (
  <svg width="28" height="28" viewBox="0 0 307 307" fill="none">
    <path d="M212.133 142.254C212.414 172.52 238.709 182.592 239 182.72C238.778 183.43 234.799 197.073 225.147 211.166C216.803 223.35 208.143 235.488 194.502 235.74C181.098 235.986 176.788 227.799 161.463 227.799C146.143 227.799 141.355 235.489 128.666 235.987C115.499 236.485 105.472 222.812 97.0591 210.673C79.8683 185.842 66.7309 140.508 84.371 109.906C93.1343 94.7092 108.795 85.0859 125.793 84.8391C138.723 84.5927 150.927 93.53 158.832 93.53C166.731 93.53 181.562 82.7821 197.153 84.3605C203.68 84.632 222.002 86.9947 233.767 104.199C232.819 104.786 211.905 116.95 212.133 142.254ZM186.941 67.933C193.932 59.4789 198.637 47.71 197.353 36C187.277 36.4046 175.092 42.7085 167.865 51.158C161.387 58.6404 155.715 70.6164 157.245 82.0946C168.477 82.9628 179.95 76.3925 186.941 67.933Z" fill="currentColor" fillOpacity="0.7"/>
  </svg>
)

const osLinks = [
  { os: 'mac' as const,     label: 'MacOS',   Icon: MacIcon },
  { os: 'windows' as const, label: 'Windows', Icon: WindowsIcon },
]

export default function HeroInktide() {
  const router = useRouter()
  const { t } = useTranslation('landing')
  const [detectedOS, setDetectedOS] = useState<'mac' | 'windows'>('windows')

  useEffect(() => {
    setDetectedOS(
      /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac/.test(navigator.userAgent)
        ? 'mac'
        : 'windows'
    )
  }, [])

  const sorted = detectedOS === 'mac' ? osLinks : [osLinks[1], osLinks[0]]

  return (
    <section className="pt-[60px] bg-[var(--bg-dark)] flex flex-col overflow-x-hidden transition-[background] duration-[250ms]">

      {/* Main grid container */}
      <div className={cn(
        'max-w-[1300px] mx-auto mt-16 px-8 pt-16 pb-8',
        'grid grid-cols-[1fr_1.2fr] gap-16 items-center flex-shrink-0',
        '[@media(max-height:950px)]:mt-6',
        'max-lg:grid-cols-1 max-lg:text-center max-lg:px-6 max-lg:py-8 max-lg:mt-8 max-lg:gap-10',
        'max-md:px-4 max-md:py-6 max-md:mt-4 max-md:gap-8',
        'max-[480px]:px-4 max-[480px]:py-4 max-[480px]:mt-2 max-[480px]:gap-6',
      )}>

        {/* Left column */}
        <div className="max-w-[540px] max-lg:max-w-full">

          <h1 className={cn(
            'font-[family-name:var(--font-heading)] text-[3.5rem] font-bold leading-[1.1]',
            'text-[var(--text-primary)] mb-6 tracking-[-0.02em]',
            'max-lg:text-[2.75rem]',
            'max-md:text-[2rem]',
            'max-[480px]:text-[1.75rem]',
          )}>
            Write your{' '}
            <span className="relative inline-block whitespace-nowrap">
              <span className="relative z-[1]">destiny</span>
              <img
                src="/icons/destiny-underline.svg"
                className="absolute left-[-4px] top-1/2 -translate-y-[52%] w-[calc(100%+8px)] h-auto z-0 pointer-events-none"
                alt=""
                aria-hidden
              />
            </span>
            {' '}in a couple of clicks
          </h1>

          <p className={cn(
            'font-[family-name:var(--font-ui)] text-[1.05rem] leading-[1.65]',
            'text-[var(--hero-subtitle-color)] mb-8 transition-[color] duration-[250ms]',
            'max-md:text-base',
            'max-[480px]:text-[0.95rem]',
          )}>
            {t('hero.subtitle')}
          </p>

          <button
            type="button"
            onClick={() => router.push('/register')}
            className={cn(
              'inline-block py-[0.875rem] px-[1.875rem] bg-[var(--hero-cta-bg)] border-none rounded-lg',
              'text-white font-[family-name:var(--font-ui)] text-base font-semibold cursor-pointer mb-8',
              'transition-[background,transform] duration-[200ms]',
              'hover:bg-[var(--hero-cta-hover-bg)] hover:-translate-y-px',
              'max-[480px]:w-full max-[480px]:text-center',
            )}
          >
            Sign up for free
          </button>

          <div className="mt-8">
            <p className="font-[family-name:var(--font-ui)] text-base font-medium text-[var(--support-color)] mb-[0.875rem]">
              Download desktop app for
            </p>
            <div className="flex items-center gap-2 max-lg:justify-center">
              {sorted.map(({ os, label, Icon }, i) => (
                <a
                  key={os}
                  href="#"
                  aria-label={label}
                  className={cn(
                    'flex items-center justify-center py-[0.55rem] px-4',
                    'border rounded-[9px] no-underline gap-[0.4rem]',
                    'font-[family-name:var(--font-ui)] text-base font-medium whitespace-nowrap',
                    'transition-[border-color,background,color] duration-[200ms]',
                    i === 0
                      ? 'bg-[var(--hero-os-active-bg)] text-[var(--hero-os-active-color)] border-[var(--hero-os-active-border)] hover:bg-[var(--hero-os-active-hover-bg)] hover:border-[var(--hero-os-active-hover-border)]'
                      : 'border-[var(--hero-os-border)] text-[var(--text-primary)] hover:border-[var(--text-muted)] hover:bg-[var(--nav-item-hover-bg)]',
                  )}
                >
                  <Icon />
                  <span>{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: hero video */}
        <div className="flex justify-center items-center min-w-0">
          <div className={cn(
            'w-full max-w-[560px] rounded-[20px] overflow-hidden bg-black',
            'shadow-[var(--hero-video-shadow)]',
            'max-lg:max-w-[480px] max-lg:rounded-2xl',
            'max-md:max-w-[360px] max-md:rounded-[14px]',
            'max-[480px]:max-w-full max-[480px]:rounded-xl',
          )}>
            <video
              src="/videos/hero.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-auto block object-cover"
            />
          </div>
        </div>
      </div>

    </section>
  )
}
