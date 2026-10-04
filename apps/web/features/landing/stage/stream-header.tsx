'use client'

import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Menu, UserRound, X } from 'lucide-react'
import { PRICING_ROUTE, REGISTER_ROUTE } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { EASE, digits, display, mono } from './broadcast'
import DuckMark from './duck-mark'
import { SOCIALS } from './stream-footer'

// The landing's header, after ZZZ's: a flat dark bar pinned to the top. At the top of
// the page the duck mark hangs out of it, big, the way their ZZ logo does; once the page
// scrolls the mark tucks away and the wordmark takes its place in the bar. The pill on
// the menu follows the chapter on screen.

const BAR = '#050608'

type NavItem = { label: string; chapter?: string; href: string }

const NAV: NavItem[] = [
  { label: 'Home', chapter: '00', href: '#top' },
  { label: 'Listen', chapter: '01', href: '#listen' },
  { label: 'Remember', chapter: '02', href: '#remember' },
  { label: 'Talk', chapter: '03', href: '#clips' },
  { label: 'Customize', chapter: '04', href: '#customize' },
  { label: 'Pricing', href: PRICING_ROUTE },
]

const LOGIN_ROUTE = '/login'
const DISCORD = SOCIALS[0]

interface StreamHeaderProps {
  /** The chapter on screen, as the scenes number themselves. */
  chapter?: string
  /** The hero has cut to LIVE; until then the header stays off its loading screen. */
  onAir: boolean
  onJump: (chapter: string) => void
}

export default function StreamHeader({ chapter, onAir, onJump }: StreamHeaderProps) {
  const reduceMotion = useReducedMotion() ?? false
  const scrolled = useScrolled(80)
  const [menuOpen, setMenuOpen] = useState(false)
  const shown = onAir || scrolled
  // At the top the header waits for the stinger to clear; further down it is just there.
  const ease = (delay = 0) => (reduceMotion ? { duration: 0 } : { duration: 0.45, delay, ease: EASE })

  const jump = (item: NavItem) => (e: MouseEvent) => {
    if (!item.chapter) return
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
          href="#top"
          onClick={jump(NAV[0])}
          aria-label="Quackie, back to the top"
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

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map(item => (
            <NavLink key={item.label} item={item} active={item.chapter === chapter} onClick={jump(item)} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href={REGISTER_ROUTE}
            className={cn(
              mono,
              'inline-flex items-center gap-2 rounded-full bg-[var(--q-duck)] px-4 py-2 text-[13px] font-semibold text-[#1A1300]',
              'transition-transform duration-200 hover:-translate-y-0.5',
            )}
          >
            <span className="size-1.5 rounded-full bg-[#1A1300]" />
            Go live
          </Link>
          <RoundLink href={DISCORD.href} label={DISCORD.label} external className="hidden lg:grid">
            <span className="size-[18px]">{DISCORD.icon}</span>
          </RoundLink>
          <RoundLink href={LOGIN_ROUTE} label="Log in" className="hidden lg:grid">
            <UserRound className="size-[18px]" strokeWidth={2.2} />
          </RoundLink>
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="grid size-9 place-items-center rounded-full ring-1 ring-[rgb(255_248_231/0.18)] lg:hidden"
          >
            {menuOpen ? <X className="size-[18px]" /> : <Menu className="size-[18px]" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && <MobileMenu chapter={chapter} onPick={jump} onClose={() => setMenuOpen(false)} />}
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
      <span className="relative">{item.label}</span>
    </>
  )

  return item.chapter ? (
    <a href={item.href} onClick={onClick} aria-current={active ? 'true' : undefined} className={className}>
      {content}
    </a>
  ) : (
    <Link href={item.href} className={className}>
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
  chapter,
  onPick,
  onClose,
}: {
  chapter?: string
  onPick: (item: NavItem) => (e: MouseEvent) => void
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.4, ease: EASE }}
      style={{ backgroundColor: BAR }}
      className="fixed inset-x-0 bottom-0 top-14 overflow-y-auto px-4 pb-10 pt-6 sm:px-6 lg:hidden"
    >
      <nav aria-label="Menu" className="flex flex-col">
        {NAV.map(item => {
          const active = item.chapter === chapter
          const content = (
            <>
              <span style={digits} className="w-12 text-[18px] text-[var(--q-duck)]">
                {item.chapter ?? '→'}
              </span>
              <span style={{ ...display, textShadow: 'none' }} className="text-[44px] uppercase">
                {item.label}
              </span>
            </>
          )
          const className = cn(
            'flex items-baseline gap-3 border-b border-[rgb(255_248_231/0.1)] py-3',
            active ? 'text-[var(--q-cream)]' : 'text-[rgb(255_248_231/0.55)]',
          )
          return item.chapter ? (
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
      <div className="mt-8 flex items-center gap-2.5">
        <RoundLink href={LOGIN_ROUTE} label="Log in" className="grid">
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
