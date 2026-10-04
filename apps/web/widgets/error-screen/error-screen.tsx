'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { GeistMono } from 'geist/font/mono'
import { motion, useReducedMotion } from 'framer-motion'
import { EASE, RevealLine, digits, display, mono, palette } from '@/features/landing/stage/broadcast'
import { cn } from '@/lib/utils'

// Full-page error screen in the landing's broadcast style, after Zenless Zone Zero's
// error pages: the status code set huge, and Quackie peeking out of a zero from
// behind its inner wall.

/** Bungee's "0" in em of the font size, measured on a 1000px render: where the
 *  counter (the hole) starts on the left and where it ends at the bottom. */
const ZERO = { counterLeft: 0.284, counterBottom: 0.681 }
/** The figure is cut a hair inside the wall, so the wall's antialiased edge can't
 *  show through as a dark seam; the sprite carries plain cream under the wall. */
const WALL_OVERLAP = 0.006

/** The peek sprite. The art's straight cut sits at `wall` of its width and the figure
 *  ends at `bottom` of its height. Left of the cut there is only the fist gripping the
 *  wall, between `fistTop` and `fistBottom`, plus plain cream that the wall hides. */
const SPRITE = {
  src: '/images/errors/quackie-peek.png',
  w: 580,
  h: 925,
  wall: 0.1319,
  bottom: 0.9784,
  fistTop: 0.6568,
  fistBottom: 0.8524,
}

/** Sprite size and place in the zero's cell, in em: the hood reaches up into the
 *  zero's top bar and the body stands on its bottom bar. */
const PEEK_H = 0.574
const PEEK_W = (PEEK_H * SPRITE.w) / SPRITE.h
const PEEK_LEFT = ZERO.counterLeft - SPRITE.wall * PEEK_W
const PEEK_TOP = ZERO.counterBottom + 0.01 - SPRITE.bottom * PEEK_H

type Point = [number, number]

/** The "!" marks by the hood, in sprite pixels, each from the end nearest the head
 *  outward. They land on the zero's yellow ring, so they're drawn in ink. */
const MARKS: [Point, Point][] = [
  [[501.6, 157.5], [546.2, 56.1]],
  [[550, 211.9], [655.2, 154.3]],
  [[561, 275.7], [665.4, 286.3]],
]
const MARK_W = 28

export type ErrorAction = { label: string; href: string } | { label: string; onClick: () => void }

export interface ErrorScreenProps {
  /** The status code, e.g. "404"; Quackie peeks out of its first zero after the first digit. */
  code: string
  /** Broadcast caption over the code, e.g. "No signal". */
  caption: string
  title: string
  description: string
  primary: ErrorAction
  secondary?: ErrorAction
  /** Error digest, shown small so users can quote it. */
  reference?: string
}

export default function ErrorScreen({ code, caption, title, description, primary, secondary, reference }: ErrorScreenProps) {
  const reduceMotion = useReducedMotion() ?? false
  const fontsReady = useFontReady(`1em ${digits.fontFamily}`)
  // The peek is laid over the zero's measured shape, so nothing plays before Bungee is in.
  const play = reduceMotion || fontsReady
  const at = (delay: number, duration = 0.7) => (reduceMotion ? { duration: 0 } : { duration, delay, ease: EASE })
  const peekAt = code.indexOf('0', 1)

  return (
    <main
      style={palette}
      className={cn(
        GeistMono.variable,
        'relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[var(--q-bg)] px-4 py-12 text-[var(--q-cream)]',
      )}
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: play ? 1 : 0 }}
        transition={at(0.1, 0.5)}
        className={cn(mono, 'flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[var(--q-duck)] sm:text-[12px]')}
      >
        <span className="h-px w-8 bg-current" />
        {caption} · {code}
        <span className="h-px w-8 bg-current" />
      </motion.p>

      <p
        role="img"
        aria-label={`Error ${code}`}
        className="flex text-[var(--q-duck)]"
        style={{ ...digits, fontSize: 'clamp(96px, min(36vw, 52dvh), 400px)', gap: '0.1em', margin: '-0.04em 0 -0.08em' }}
      >
        {[...code].map((char, i) => (
          <span key={i} aria-hidden className="relative block">
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: '100%' }}
                animate={{ y: play ? 0 : '100%' }}
                transition={at(i * 0.08)}
              >
                {char}
              </motion.span>
            </span>
            {i === peekAt && <Peek play={play} at={at} />}
          </span>
        ))}
      </p>

      <h1
        style={{ ...display, textShadow: 'none' }}
        className="mt-3 max-w-[18ch] text-center text-[clamp(30px,4.4vw,60px)] uppercase"
      >
        <RevealLine delay={reduceMotion ? 0 : 0.3} play={play}>
          {title}
        </RevealLine>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={play ? { opacity: 1, y: 0 } : {}}
        transition={at(0.45, 0.6)}
        className="mt-4 max-w-[30rem] text-center text-[15px] leading-relaxed text-[var(--q-cream-dim)] sm:text-base"
      >
        {description}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={play ? { opacity: 1, y: 0 } : {}}
        transition={at(0.6, 0.6)}
        className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4"
      >
        <ActionLink action={primary} primary />
        {secondary && <ActionLink action={secondary} />}
      </motion.div>

      {reference && (
        <p className={cn(mono, 'mt-8 text-[11px] uppercase tracking-[0.16em] text-[var(--q-cream-dim)]')}>
          Ref · {reference}
        </p>
      )}
    </main>
  )
}

/** Quackie slides out from behind the zero's inner wall, grips it, and the marks pop. */
function Peek({ play, at }: { play: boolean; at: (delay: number, duration?: number) => object }) {
  const sprite: CSSProperties = {
    position: 'absolute',
    top: `${PEEK_TOP}em`,
    width: `${PEEK_W}em`,
    height: `${PEEK_H}em`,
    maxWidth: 'none',
  }

  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 select-none">
      {/* Behind the wall: clipped at the counter's left edge, so the figure appears from under it. */}
      <span
        className="absolute top-0 h-[1em] w-[0.6em] overflow-hidden"
        style={{ left: `${ZERO.counterLeft - WALL_OVERLAP}em` }}
      >
        <motion.img
          src={SPRITE.src}
          alt=""
          draggable={false}
          style={{ ...sprite, left: `${PEEK_LEFT - ZERO.counterLeft + WALL_OVERLAP}em` }}
          initial={{ x: '-100%' }}
          animate={{ x: play ? 0 : '-100%' }}
          transition={at(0.55, 0.9)}
        />
      </span>

      {/* The fist, in front of the wall. */}
      <motion.img
        src={SPRITE.src}
        alt=""
        draggable={false}
        style={{
          ...sprite,
          left: `${PEEK_LEFT}em`,
          clipPath: `inset(${SPRITE.fistTop * 100}% ${(1 - SPRITE.wall) * 100}% ${(1 - SPRITE.fistBottom) * 100}% 0)`,
        }}
        initial={{ opacity: 0, x: '4%' }}
        animate={play ? { opacity: 1, x: 0 } : {}}
        transition={at(1.25, 0.25)}
      />

      <svg
        className="absolute overflow-visible"
        style={{ left: `${PEEK_LEFT}em`, top: `${PEEK_TOP}em`, width: `${PEEK_W}em`, height: `${PEEK_H}em` }}
        viewBox={`0 0 ${SPRITE.w} ${SPRITE.h}`}
        fill="none"
      >
        {MARKS.map(([[ax, ay], [bx, by]], i) => (
          <motion.path
            key={i}
            d={`M${ax} ${ay}L${bx} ${by}`}
            stroke="var(--q-bg)"
            strokeWidth={MARK_W}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: play ? 1 : 0 }}
            transition={at(1.4 + i * 0.07, 0.18)}
          />
        ))}
      </svg>
    </span>
  )
}

function ActionLink({ action, primary = false }: { action: ErrorAction; primary?: boolean }) {
  const className = primary
    ? cn(
        mono,
        'inline-flex items-center gap-3 rounded-full bg-[var(--q-duck)] px-7 py-3.5',
        'text-[15px] font-semibold text-[#1A1300] transition-transform duration-200 hover:-translate-y-0.5',
      )
    : cn(mono, 'text-[12px] uppercase tracking-[0.16em] text-[var(--q-cream-dim)] transition-colors hover:text-[var(--q-cream)]')
  const content: ReactNode = (
    <>
      {primary && <span className="size-2 rounded-full bg-[#1A1300]" />}
      {action.label}
    </>
  )

  return 'href' in action ? (
    <Link href={action.href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  )
}

/** True once the given font has loaded, or after a short grace period if it can't. */
function useFontReady(font: string) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let live = true
    const done = () => {
      if (live) setReady(true)
    }
    document.fonts.load(font).then(done, done)
    const fallback = window.setTimeout(done, 1500)
    return () => {
      live = false
      window.clearTimeout(fallback)
    }
  }, [font])

  return ready
}
