'use client'

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, UserRound, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n/languages'
import { LANDING_ROUTE, PRICING_ROUTE, REGISTER_ROUTE } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { EASE, digits, display, mono } from './broadcast'
import DuckMark from './duck-mark'
import { SOCIALS } from './stream-footer'

// The landing's header, after ZZZ's: a flat dark bar pinned to the top. At the top of
// the page the duck mark hangs out of it, big, the way their ZZ logo does; once the page
// scrolls the mark tucks away and the wordmark takes its place in the bar. The pill on
// the menu follows the chapter on screen.

const BAR = '#050608'

// `label` is a key under stage.nav in landing.json.
type NavItem = { label: string; chapter?: string; href: string }

const NAV: NavItem[] = [
  { label: 'home', chapter: '00', href: '#top' },
  { label: 'listen', chapter: '01', href: '#listen' },
  { label: 'remember', chapter: '02', href: '#remember' },
  { label: 'talk', chapter: '03', href: '#clips' },
  { label: 'customize', chapter: '04', href: '#customize' },
  { label: 'pricing', href: PRICING_ROUTE },
]

const LOGIN_ROUTE = '/login'
const DISCORD = SOCIALS[0]

const onLanding = (hash: string) => (hash === '#top' ? LANDING_ROUTE : `${LANDING_ROUTE}${hash}`)

interface StreamHeaderProps {
  /** The chapter on screen, as the scenes number themselves. */
  chapter?: string
  /** The hero has cut to LIVE; until then the header stays off its loading screen. */
  onAir: boolean
  /** Scrolls the landing to a chapter. Other pages leave it out: their chapters link to the landing. */
  onJump?: (chapter: string) => void
}

export default function StreamHeader({ chapter, onAir, onJump }: StreamHeaderProps) {
  const reduceMotion = useReducedMotion() ?? false
  const scrolled = useScrolled(80)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation('landing')
  const shown = onAir || scrolled
  // At the top the header waits for the stinger to clear; further down it is just there.
  const ease = (delay = 0) => (reduceMotion ? { duration: 0 } : { duration: 0.45, delay, ease: EASE })

  const nav = onJump ? NAV : NAV.map(item => (item.chapter ? { ...item, href: onLanding(item.href) } : item))
  const isActive = (item: NavItem) => (item.chapter ? item.chapter === chapter : item.href === pathname)

  const jump = (item: NavItem) => (e: MouseEvent) => {
    if (!item.chapter || !onJump) return
    e.preventDefault()
    setMenuOpen(false)
    onJump(item.chapter)
  }

  return (
    <motion.header
      initial={{ y: '-100%' }}
      animate={{ y: shown ? 0 : '-100%' }}
      transition={ease(shown && !scrolled ? 0.75 : 0)}
      className="fixed inset-x-0 top-0 z-50 text-[var(--q-cream)]"
    >
      <div
        style={{ backgroundColor: BAR }}
        className="relative flex h-14 items-center gap-8 px-4 sm:px-6 lg:px-[6.5vw]"
      >
        {/* The logo slot keeps its width, so the menu doesn't shift when the marks swap. */}
        <a
          href={nav[0].href}
          onClick={jump(nav[0])}
          aria-label={t('stage.nav.backToTop')}
          className="relative flex h-full shrink-0 items-center lg:w-[150px]"
        >
          <motion.span
            animate={{ opacity: scrolled ? 1 : 0, y: scrolled ? 0 : 6 }}
            transition={ease()}
            className="hidden lg:block"
          >
            <Image src="/logo/quackie/quackie-logo-dark.svg" alt="" width={1890} height={344} unoptimized className="h-6 w-auto" />
          </motion.span>
          {/* Phones have no room for the hanging mark; the wordmark is always in the bar. */}
          <Image
            src="/logo/quackie/quackie-logo-dark.svg"
            alt=""
            width={1890}
            height={344}
            unoptimized
            className="h-[22px] w-auto lg:hidden"
          />
          <HangingMark hidden={scrolled || !shown} transition={ease()} />
        </a>

        <nav aria-label={t('stage.nav.main')} className="hidden items-center gap-1 lg:flex">
          {nav.map(item => (
            <NavLink key={item.label} item={item} active={isActive(item)} onClick={jump(item)} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <LanguageToggle className="hidden lg:flex" />
          <Link
            href={REGISTER_ROUTE}
            className={cn(
              mono,
              'inline-flex items-center gap-2 rounded-full bg-[var(--q-duck)] px-4 py-2 text-[13px] font-semibold text-[#1A1300]',
              'transition-transform duration-200 hover:-translate-y-0.5',
            )}
          >
            <span className="size-1.5 rounded-full bg-[#1A1300]" />
            {t('stage.hero.cta')}
          </Link>
          <RoundLink href={DISCORD.href} label={DISCORD.label} external className="hidden lg:grid">
            <span className="size-[18px]">{DISCORD.icon}</span>
          </RoundLink>
          <RoundLink href={LOGIN_ROUTE} label={t('stage.nav.logIn')} className="hidden lg:grid">
            <UserRound className="size-[18px]" strokeWidth={2.2} />
          </RoundLink>
          <button
            type="button"
            aria-label={menuOpen ? t('stage.nav.closeMenu') : t('stage.nav.openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-9 place-items-center rounded-full ring-1 ring-[rgb(255_248_231/0.18)] lg:hidden"
          >
            {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && <MobileMenu items={nav} isActive={isActive} onPick={jump} onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </motion.header>
  )
}

/** The big duck hanging out of the bar, eyes on the pointer. */
function HangingMark({ hidden, transition }: { hidden: boolean; transition: object }) {
  return (
    <motion.span
      aria-hidden
      initial={false}
      animate={{ y: hidden ? '-120%' : 0, opacity: hidden ? 0 : 1 }}
      transition={transition}
      className="pointer-events-none absolute left-[-10px] top-[7px] hidden w-[164px] -rotate-6 lg:block"
    >
      <DuckMark className="block w-full" outline={{ color: BAR, width: 30 }} />
    </motion.span>
  )
}

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: (e: MouseEvent) => void }) {
  const { t } = useTranslation('landing')
  const className = cn(
    'relative rounded-full px-3.5 py-1.5 text-[14px] font-semibold transition-colors duration-300',
    active ? 'text-[var(--q-bg)]' : 'text-[rgb(255_248_231/0.5)] hover:bg-[rgb(255_248_231/0.1)] hover:text-[var(--q-cream)]',
  )
  const content = (
    <>
      {active && (
        <motion.span
          layoutId="stream-header-pill"
          transition={{ duration: 0.5, ease: EASE }}
          className="absolute inset-0 rounded-full bg-[var(--q-cream)]"
        />
      )}
      <span className="relative">{t(`stage.nav.${item.label}`)}</span>
    </>
  )

  return item.href.startsWith('#') ? (
    <a href={item.href} onClick={onClick} aria-current={active ? 'true' : undefined} className={className}>
      {content}
    </a>
  ) : (
    <Link href={item.href} aria-current={active ? 'page' : undefined} className={className}>
      {content}
    </Link>
  )
}

function RoundLink({
  href,
  label,
  external = false,
  className,
  children,
}: {
  href: string
  label: string
  external?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className={cn(
        'size-9 place-items-center rounded-full text-[var(--q-cream)] ring-1 ring-[rgb(255_248_231/0.18)]',
        'transition-colors hover:bg-[var(--q-cream)] hover:text-[var(--q-bg)]',
        className,
      )}
    >
      {children}
    </Link>
  )
}

/** Phones: the menu drops down from the bar, chapters set as big as section headers. */
function MobileMenu({
  items,
  isActive,
  onPick,
  onClose,
}: {
  items: NavItem[]
  isActive: (item: NavItem) => boolean
  onPick: (item: NavItem) => (e: MouseEvent) => void
  onClose: () => void
}) {
  const { t } = useTranslation('landing')
  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{ backgroundColor: BAR }}
      className="fixed inset-x-0 bottom-0 top-14 overflow-y-auto px-4 pb-10 pt-6 sm:px-6 lg:hidden"
    >
      <nav aria-label={t('stage.nav.menu')} className="flex flex-col">
        {items.map(item => {
          const active = isActive(item)
          const content = (
            <>
              <span style={digits} className="w-12 text-[18px] text-[var(--q-duck)]">
                {item.chapter ?? '→'}
              </span>
              <span style={{ ...display, textShadow: 'none' }} className="text-[44px] uppercase">
                {t(`stage.nav.${item.label}`)}
              </span>
            </>
          )
          const className = cn(
            'flex items-baseline gap-3 border-b border-[rgb(255_248_231/0.1)] py-3',
            active ? 'text-[var(--q-cream)]' : 'text-[rgb(255_248_231/0.55)]',
          )
          return item.href.startsWith('#') ? (
            <a key={item.label} href={item.href} onClick={onPick(item)} className={className}>
              {content}
            </a>
          ) : (
            <Link key={item.label} href={item.href} onClick={onClose} className={className}>
              {content}
            </Link>
          )
        })}
      </nav>
      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        <LanguageToggle className="mr-2 flex" />
        <RoundLink href={LOGIN_ROUTE} label={t('stage.nav.logIn')} className="grid">
          <UserRound className="size-[18px]" strokeWidth={2.2} />
        </RoundLink>
        {SOCIALS.map(s => (
          <RoundLink key={s.label} href={s.href} label={s.label} external className="grid">
            <span className="size-[18px]">{s.icon}</span>
          </RoundLink>
        ))}
      </div>
    </motion.div>
  )
}

/** RU / EN, as on the sign-in pages. The server re-renders afterwards, so <html lang> and the title follow. */
function LanguageToggle({ className }: { className?: string }) {
  const { t, i18n } = useTranslation('landing')
  const router = useRouter()
  const current = (i18n.resolvedLanguage ?? 'en') as Language
  const pick = (lang: Language) => {
    if (lang === current) return
    void i18n.changeLanguage(lang).then(() => router.refresh())
  }

  return (
    <div role="group" aria-label={t('stage.nav.language')} className={cn(mono, 'items-center gap-0.5 text-[12px] font-semibold', className)}>
      {[...SUPPORTED_LANGUAGES].reverse().map(lang => (
        <button
          key={lang}
          type="button"
          aria-pressed={lang === current}
          onClick={() => pick(lang)}
          className={cn(
            'rounded-full px-2.5 py-1 uppercase tracking-[0.12em] transition-colors',
            lang === current ? 'bg-[var(--q-cream)] text-[var(--q-bg)]' : 'text-[rgb(255_248_231/0.5)] hover:text-[var(--q-cream)]',
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}

function useScrolled(threshold: number) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [threshold])

  return scrolled
}
