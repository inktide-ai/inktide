'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Corners,
  EASE,
  PagerMarks,
  RevealLine,
  Timecode,
  digits,
  display,
  mono,
  palette,
  CHAT_BAND,
  bandPoints,
  useLoopSrc,
  useSceneFocus,
  type LoopSources,
} from './broadcast'

// Scene 02: proof that Quackie reads chat. Laid out like a game's character
// carousel — each slide is one viewer message set as big as a hero's name, with
// Quackie's reply and the face that goes with it. Quackie sits in a cream
// "screen" on the same dark ground as the starting-soon scene.

const LOOP: LoopSources = {
  webm: { hd: '/videos/landing/chat-loop-1440.webm', sd: '/videos/landing/chat-loop-1080.webm' },
  hevc: { hd: '/videos/landing/chat-loop-1440-hevc.mov', sd: '/videos/landing/chat-loop-1080-hevc.mov' },
}

type Slide = {
  platform: string
  user: string
  message: string[]
  reply: string
  /** Keyed full-frame art; the first slide's is also the loop's poster. */
  still: string
  thumb: string
  face: string
}

// The stills are frames of the same Flow clip, so the three faces match exactly.
const SLIDES: Slide[] = [
  {
    platform: 'Twitch',
    user: 'alex',
    message: ['Quackie,', 'rate my', 'aim 1–10'],
    reply: '3/10. But the confidence? Eleven.',
    still: '/images/landing/chat/still-laugh.png',
    thumb: '/images/landing/chat/thumb-laugh.png',
    face: 'laughing',
  },
  {
    platform: 'Discord',
    user: 'voidwalker',
    message: ['Do you', 'read', 'chat?'],
    reply: 'Every word, voidwalker. Every. Word.',
    still: '/images/landing/chat/still-tease.png',
    thumb: '/images/landing/chat/thumb-tease.png',
    face: 'teasing',
  },
  {
    platform: 'Telegram',
    user: 'luna_rin',
    message: ['Had a', 'rough', 'day…'],
    reply: 'Then stay a while. I saved you a seat.',
    still: '/images/landing/chat/still-warm.png',
    thumb: '/images/landing/chat/thumb-warm.png',
    face: 'warm',
  },
]

const SLIDE_MS = 6500

// The white panel in the stage's 1280×720 space. The character is clipped to its
// top and right edges: the source frame crops the top of the hood, and lining that
// crop up with the panel's edge makes it read as a window, not a cut.
const PANEL_CLIP = 'polygon(0 21.94%, 67.19% 21.94%, 51.07% 100%, 0 100%)'

export default function ChatScene() {
  const ref = useRef<HTMLElement>(null)
  const { entered, focused, settled } = useSceneFocus(ref)
  const reduceMotion = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)
  const autoplay = focused && !reduceMotion

  // Any index change (auto or manual) restarts the clock for the next slide.
  useEffect(() => {
    if (!autoplay) return
    const id = window.setTimeout(() => setIndex(i => (i + 1) % SLIDES.length), SLIDE_MS)
    return () => window.clearTimeout(id)
  }, [index, autoplay])

  const go = (step: number) => setIndex(i => (i + step + SLIDES.length) % SLIDES.length)
  const slide = SLIDES[index]

  return (
    <section
      ref={ref}
      id="chat"
      style={palette}
      aria-roledescription="carousel"
      aria-label="Quackie reads every chat"
      className={cn(
        'relative isolate h-[100svh] min-h-[640px] w-full overflow-hidden select-none',
        // On desktop the deck paints the ground, so the travelling band can pass under the scene.
        'bg-[var(--q-bg)] text-[var(--q-cream)] lg:bg-transparent',
      )}
    >
      <Stage
        slide={slide}
        index={index}
        entered={entered}
        settled={settled}
        still={reduceMotion}
        controls={<Carousel index={index} autoplay={autoplay} onPick={setIndex} onStep={go} className="mt-[2.4cqw] w-fit" />}
      />

      {/* Same vignette + scanlines as the starting-soon scene: one broadcast, two scenes. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_60%,rgb(0_0_0/0.45)_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.025)_0_1px,transparent_1px_4px)]" />

      {/* Phones: copy stacks above the art instead of beside it. */}
      <div className="relative z-20 px-6 pt-20 lg:hidden">
        <span className={cn(mono, 'inline-block -skew-x-12 bg-[var(--q-duck)] px-2 py-0.5 text-[11px] tracking-[0.14em] text-[var(--q-bg)]')}>
          02 / CHAT
        </span>
        {entered && <SlideCopy slide={slide} index={index} className="mt-4 text-[12.5vw]" />}
        <Carousel index={index} autoplay={autoplay} onPick={setIndex} onStep={go} className="mt-5 w-fit" />
      </div>

      <Corners />

      <span className={cn(mono, 'absolute right-[calc(2.2vw+56px)] top-[calc(3.2vh+12px)] z-30 hidden text-[12px] tracking-[0.12em] lg:block')}>
        SCENE 02 — CHAT
      </span>

      <div className={cn(mono, 'absolute right-[2.4vw] top-[60%] z-20 hidden flex-col items-center text-center lg:flex')}>
        <PagerMarks active={1} />
      </div>

      <div className={cn(mono, 'absolute bottom-14 left-[6.5vw] z-20 hidden lg:block')}>
        <div className="text-[19px] tracking-[0.06em]">
          <Timecode />
        </div>
        <div className="mt-2.5 h-px w-[320px] bg-[rgb(255_248_231/0.25)]" />
      </div>
    </section>
  )
}

// ── Stage: band, panel, character and (on desktop) the copy, in one 16:9 box ──

function Stage({
  slide,
  index,
  entered,
  settled,
  still,
  controls,
}: {
  slide: Slide
  index: number
  entered: boolean
  /** False while the deck is flying the band in or out; the deck draws it then. */
  settled: boolean
  still: boolean
  /** Desktop carousel, set under the copy inside the composition. */
  controls: ReactNode
}) {
  return (
    // Desktop covers the viewport from the centre; phones zoom onto the character
    // at the bottom. Sizes inside are in cqw so the composition scales as one piece.
    <div
      className={cn(
        'absolute aspect-video @container',
        'bottom-0 left-[-30vw] w-[190vw]',
        'lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[max(100vw,calc(100svh*16/9))] lg:-translate-x-1/2 lg:-translate-y-1/2',
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 1280 720"
        preserveAspectRatio="none"
        className={cn('absolute inset-0 size-full', !settled && 'opacity-0')}
      >
        <polygon className="fill-[var(--q-duck)]" points={bandPoints(CHAT_BAND)} />
      </svg>

      <motion.svg
        aria-hidden
        viewBox="0 0 1280 720"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        initial={{ opacity: 0, x: '-6%' }}
        animate={entered ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.9, ease: EASE }}
      >
        {/* A yellow slab peeking past the cream window gives its diagonal a hard edge. */}
        <polygon className="fill-[var(--q-duck)]" points="374,158 874,158 664,730 204,730" />
        <polygon className="fill-[var(--q-cream)]" points="360,158 860,158 650,730 190,730" />
      </motion.svg>

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-[6%] top-[19%] hidden text-[var(--q-bg)] lg:block"
        initial={{ opacity: 0, x: '-30%' }}
        animate={entered ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
      >
        <div style={digits} className="origin-bottom-left -skew-x-[11deg] text-[15cqw]">
          02
        </div>
        <div style={{ ...display, textShadow: 'none', fontStretch: '84%' }} className="mt-[0.08em] text-[7.5cqw] uppercase">
          Chat
        </div>
      </motion.div>

      <div className="absolute inset-0 [filter:drop-shadow(-8px_5px_0_var(--q-bg))]" style={{ clipPath: PANEL_CLIP }}>
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            className="absolute left-[-5.4%] top-[21.4%] aspect-video w-[78.1%]"
            initial={{ opacity: 0, x: '7%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-5%' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <SlideArt slide={slide} loop={index === 0 && !still} />
          </motion.div>
        </AnimatePresence>
      </div>

      {entered && (
        <div className="absolute left-[69%] top-[23%] hidden w-[20%] lg:block">
          <SlideCopy slide={slide} index={index} className="text-[4.8cqw]" />
          {controls}
        </div>
      )}
    </div>
  )
}

function SlideArt({ slide, loop }: { slide: Slide; loop: boolean }) {
  const loopSrc = useLoopSrc(LOOP)
  const [playing, setPlaying] = useState(false)

  return (
    <>
      <Image
        src={slide.still}
        alt={`Quackie, ${slide.face}`}
        fill
        sizes="(min-width: 1024px) 82vw, 156vw"
        className={cn('object-cover transition-opacity duration-300', loop && playing && 'opacity-0')}
      />
      {loop && loopSrc && (
        <video
          src={loopSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(true)}
          className={cn('absolute inset-0 size-full transition-opacity duration-300', playing ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </>
  )
}

// ── Copy: the viewer's message as the headline, Quackie's reply under it ─────

function SlideCopy({ slide, index, className }: { slide: Slide; index: number; className?: string }) {
  return (
    <div className={className} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={index} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
          <motion.span
            className={cn(mono, 'inline-block -skew-x-12 bg-[var(--q-cream)] px-[0.55em] py-[0.2em] text-[0.24em] tracking-[0.06em] text-[var(--q-bg)]')}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {slide.platform.toUpperCase()} · {slide.user}
          </motion.span>

          <blockquote style={{ ...display, textShadow: 'none', fontStretch: '84%' }} className="mt-[0.18em] uppercase">
            {slide.message.map((line, i) => (
              <RevealLine key={line} delay={0.08 + i * 0.08}>
                {line}
              </RevealLine>
            ))}
          </blockquote>

          <motion.div
            className="mt-[0.32em] flex w-fit -skew-x-6 items-center gap-[0.25em] bg-[var(--q-duck)] py-[0.16em] pl-[0.16em] pr-[0.4em]"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.55, delay: 0.42, ease: EASE }}
          >
            <Image
              src="/logo/quackie/quackie-icon.svg"
              alt=""
              width={1024}
              height={1024}
              unoptimized
              className="size-[0.62em] skew-x-6 rounded-[0.12em]"
            />
            <p className={cn(mono, 'skew-x-6 text-[0.2em] font-medium leading-snug')}>{slide.reply}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Carousel: black pill with the three faces, like a character picker ──────

function Carousel({
  index,
  autoplay,
  onPick,
  onStep,
  className,
}: {
  index: number
  autoplay: boolean
  onPick: (i: number) => void
  onStep: (step: number) => void
  className?: string
}) {
  const arrow = 'grid size-9 place-items-center rounded-full text-[var(--q-cream)] transition-colors hover:bg-white/10'
  return (
    <div className={cn('flex items-center gap-2 rounded-full bg-[#1B1F2A] p-2 ring-1 ring-[rgb(255_248_231/0.12)]', className)}>
      <button type="button" aria-label="Previous message" onClick={() => onStep(-1)} className={arrow}>
        <ChevronLeft className="size-5" />
      </button>
      {SLIDES.map((s, i) => (
        <button
          key={s.thumb}
          type="button"
          aria-label={`${s.platform} · ${s.user}`}
          aria-current={i === index}
          onClick={() => onPick(i)}
          className={cn(
            'relative size-12 overflow-hidden rounded-lg border-2 transition-[opacity,border-color] duration-300',
            i === index ? 'border-[var(--q-duck)]' : 'border-transparent opacity-60 hover:opacity-90',
          )}
        >
          <Image src={s.thumb} alt="" fill sizes="48px" className="object-cover" />
          {i === index && autoplay && (
            <motion.span
              key={index}
              className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[var(--q-duck)]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: SLIDE_MS / 1000, ease: 'linear' }}
            />
          )}
        </button>
      ))}
      <button type="button" aria-label="Next message" onClick={() => onStep(1)} className={arrow}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
