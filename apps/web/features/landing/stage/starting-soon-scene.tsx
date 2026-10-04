'use client'

import { useEffect, useState, useSyncExternalStore, type CSSProperties, type PointerEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { REGISTER_ROUTE } from '@/lib/routes'
import { cn } from '@/lib/utils'
import {
  Corners,
  EASE,
  RevealLine,
  Timecode,
  digits,
  display,
  mono,
  palette,
  STARTING_SOON_BAND,
  bandPoints,
  useLoopSrc,
  useSceneState,
  type LoopSources,
} from './broadcast'

// Scene 00 of the "the site is a stream" landing: a starting-soon screen that
// counts down and cuts to LIVE through a duck stinger. Only the character is
// raster art (a keyed, looping video); the panel, halftone and broadcast UI are
// drawn here so they stay crisp at any size.
//
// The countdown is also the page's loading screen: 03 holds until the art and the
// type are in, the page doesn't scroll until LIVE, and any scroll, tap or key skips
// ahead. It plays once per tab; after that the page opens on LIVE.

const POSTER = '/images/landing/starting-soon-poster.png'

// Upscaled from the 720p Flow render with Real-ESRGAN (animevideov3); phones
// get the 1080p cut to spare mobile data.
const LOOP: LoopSources = {
  webm: { hd: '/videos/landing/starting-soon-loop-1440.webm', sd: '/videos/landing/starting-soon-loop-1080.webm' },
  hevc: { hd: '/videos/landing/starting-soon-loop-1440-hevc.mov', sd: '/videos/landing/starting-soon-loop-1080-hevc.mov' },
}

const COUNT_FROM = 3
// 03 holds at least this long, so the entrance plays out, and then until the hero has
// loaded, but never past MAX_HOLD from the page opening.
const MIN_HOLD = 1600
const MAX_HOLD = 5000

const SEEN_KEY = 'quackie:intro-seen'

const readSeen = () => {
  try {
    return sessionStorage.getItem(SEEN_KEY) !== null
  } catch {
    return false
  }
}

const subscribeNever = () => () => {}

// Runs as the HTML is parsed, ahead of the card: a tab that has already seen the
// intro hides it until hydration hands over to LIVE, so it never flashes.
const SEEN_SCRIPT = `try{sessionStorage.getItem('${SEEN_KEY}')!==null&&(document.documentElement.dataset.intro='seen')}catch(e){}`
const hiddenIfSeen = '[html[data-intro=seen]_&]:invisible'

// Keys that scroll the page; the countdown swallows them along with the wheel.
const SCROLL_KEYS = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'])
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta'])

// The starting-soon card copies the approved mockup: a heavier, wider cut of the
// display face with a couple of knife cuts, and Bungee for the squared-off digits.
const TITLE_CUTS = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'>" +
    "<path fill-rule='evenodd' d='M-10-10H110V110H-10Z M1 40 8 9 8.9 9 1.9 40Z M40 94 47 57 47.8 57 40.8 94Z'/></svg>",
)}")`

const soonType: CSSProperties = {
  ...display,
  fontStretch: '84%',
  lineHeight: 0.82,
  letterSpacing: '-0.025em',
  WebkitTextStroke: '0.022em var(--q-cream)',
  maskImage: TITLE_CUTS,
  WebkitMaskImage: TITLE_CUTS,
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
}

const countType: CSSProperties = {
  ...digits,
  WebkitTextStroke: '0.012em var(--q-duck)',
}

// Paint flicks around the type: anchored in % of the block, sized in em so they
// scale with the type instead of stretching with the box.
type Flick = { left: string; top: string; length: string; angle: number; taper?: boolean }

const TITLE_FLICKS: Flick[] = [
  { left: '-5.5%', top: '30%', length: '0.5em', angle: -12, taper: true },
  { left: '93%', top: '2%', length: '0.36em', angle: -36, taper: true },
  { left: '53%', top: '96%', length: '0.3em', angle: -38, taper: true },
]
const COUNT_FLICKS: Flick[] = [
  { left: '121%', top: '52%', length: '0.17em', angle: -68 },
  { left: '125.5%', top: '52%', length: '0.17em', angle: -68 },
]

/** `onLiveChange` reports the cut to LIVE, so the page's header can wait for it. */
export default function StartingSoonScene({ onLiveChange }: { onLiveChange?: (live: boolean) => void }) {
  const deck = useSceneState()
  const reduceMotion = useReducedMotion() ?? false
  const seen = useSyncExternalStore(subscribeNever, readSeen, () => false)
  // True in the server render and through hydration, false once the client has taken over.
  const hydrating = useSyncExternalStore(subscribeNever, () => false, () => true)
  const [count, setCount] = useState(COUNT_FROM)
  const [stinger, setStinger] = useState(false)
  // Null until the countdown or a replay decides; a tab that has seen the intro opens live.
  const [onAir, setOnAir] = useState<boolean | null>(null)
  const live = onAir ?? seen

  // What 03 waits for: the poster and the loop (reported by the art) and the display faces.
  const [posterReady, setPosterReady] = useState(false)
  const [loopReady, setLoopReady] = useState(false)
  const [fontsReady, setFontsReady] = useState(false)
  const [stalled, setStalled] = useState(false)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    let alive = true
    const done = () => alive && setFontsReady(true)
    Promise.all([
      document.fonts.load(`italic 900 1em ${display.fontFamily}`),
      document.fonts.load(`1em ${digits.fontFamily}`),
    ]).then(done, done)
    const id = window.setTimeout(() => setStalled(true), MAX_HOLD)
    return () => {
      alive = false
      window.clearTimeout(id)
    }
  }, [])

  useEffect(() => {
    if (live || held) return
    const id = window.setTimeout(() => setHeld(true), MIN_HOLD)
    return () => window.clearTimeout(id)
  }, [live, held])

  const loaded = (posterReady && (loopReady || reduceMotion) && fontsReady) || stalled

  // 03 holds until the hero is ready, then one tick per second; with reduced motion
  // the cut to LIVE is plain, without the stinger.
  useEffect(() => {
    if (live || stinger || !held || !loaded) return
    const id = window.setTimeout(() => {
      if (count > 1) setCount(count - 1)
      else if (reduceMotion) setOnAir(true)
      else setStinger(true)
    }, count === COUNT_FROM ? 0 : 1000)
    return () => window.clearTimeout(id)
  }, [count, live, stinger, held, loaded, reduceMotion])

  // Swap the scene while the stinger covers the screen.
  useEffect(() => {
    if (!stinger) return
    const id = window.setTimeout(() => setOnAir(true), 560)
    return () => window.clearTimeout(id)
  }, [stinger])

  useEffect(() => {
    if (!onAir) return
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
  }, [onAir])

  useEffect(() => {
    onLiveChange?.(live)
  }, [live, onLiveChange])

  // Until LIVE has fully cut in, the page holds still: the wheel, touch drags and
  // scrolling keys are swallowed, and the first of them, or any tap or key, skips to
  // the stinger. It lets go once the stinger has cleared, so a flick's momentum
  // doesn't carry the viewer straight past LIVE.
  const intro = !live || stinger
  useEffect(() => {
    if (!intro) return
    const skip = () => (reduceMotion ? setOnAir(true) : setStinger(true))
    const swallow = (e: Event) => {
      if (e.cancelable) e.preventDefault()
      skip()
    }
    const onKey = (e: KeyboardEvent) => {
      if (MODIFIER_KEYS.has(e.key)) return
      if (SCROLL_KEYS.has(e.key)) e.preventDefault()
      skip()
    }
    // Anything that scrolls anyway (the scrollbar, a restored position) counts as a skip too.
    const onScroll = () => window.scrollY > 0 && skip()
    const active = { capture: true, passive: false }
    window.addEventListener('wheel', swallow, active)
    window.addEventListener('touchmove', swallow, active)
    window.addEventListener('pointerdown', skip, true)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', swallow, active)
      window.removeEventListener('touchmove', swallow, active)
      window.removeEventListener('pointerdown', skip, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll)
    }
  }, [intro, reduceMotion])

  const replay = () => {
    delete document.documentElement.dataset.intro
    setOnAir(false)
    setStinger(false)
    setHeld(false)
    setCount(COUNT_FROM)
  }

  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 50, damping: 18 })
  const sy = useSpring(py, { stiffness: 50, damping: 18 })

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduceMotion || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set(((e.clientX - r.left) / r.width) * 2 - 1)
    py.set(((e.clientY - r.top) / r.height) * 2 - 1)
  }

  return (
    <section
      style={palette}
      onPointerMove={onPointerMove}
      className={cn(
        'relative isolate h-[100svh] min-h-[600px] w-full overflow-hidden select-none lg:snap-start',
        // On desktop the track paints the ground and carries its slabs on into the next scene.
        'bg-[var(--q-bg)] text-[var(--q-cream)] lg:bg-transparent',
      )}
      data-chapter="00"
    >
      {/* Only the server's HTML needs it; a script React creates itself never runs anyway. */}
      {hydrating && <script dangerouslySetInnerHTML={{ __html: SEEN_SCRIPT }} />}

      <Art
        sx={sx}
        sy={sy}
        still={reduceMotion}
        bandShown={!deck || deck.settled}
        characterShown={posterReady || stalled}
        onPosterReady={() => setPosterReady(true)}
        onLoopReady={() => setLoopReady(true)}
      />

      {/* Vignette + scanlines sit over the art, under the UI */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(120%_90%_at_70%_45%,transparent_55%,rgb(0_0_0/0.5)_100%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-10 bg-[repeating-linear-gradient(to_bottom,rgb(255_255_255/0.025)_0_1px,transparent_1px_4px)]" />

      {/* Once live the page's header covers the top edge, so the upper corners drop below it. */}
      <Corners topClassName={live ? 'top-[72px] sm:top-[calc(56px_+_3.2vh)]' : undefined} />
      <OnAirBadge live={live} />

      <div className="pointer-events-none absolute left-[2.2vw] top-1/2 z-20 hidden -translate-y-1/2 rotate-180 lg:block">
        <span className={cn(mono, 'text-[11px] tracking-[0.32em] [writing-mode:vertical-rl]')}>
          QUACKIE <span className="text-[var(--q-duck)]">{'// ON AIR'}</span>
        </span>
      </div>

      <Headline sx={sx} live={live} count={count} onReplay={replay} />

      <div className={cn(mono, 'absolute bottom-10 left-6 z-20 sm:left-[6.5vw] sm:bottom-14')}>
        <div className="text-[15px] tracking-[0.06em] text-[var(--q-cream)] sm:text-[19px]">
          <Timecode />
        </div>
        <div className="mt-2.5 h-px w-[min(320px,60vw)] bg-[rgb(255_248_231/0.25)]" />
      </div>

      <Stinger active={stinger && !reduceMotion} onDone={() => setStinger(false)} />
    </section>
  )
}

// ── Art: halftone + vector panel + keyed character, in the video's 16:9 frame ──

function Art({
  sx,
  sy,
  still,
  bandShown,
  characterShown,
  onPosterReady,
  onLoopReady,
}: {
  sx: MotionValue<number>
  sy: MotionValue<number>
  still: boolean
  /** False while the deck flies the band to or from another scene. */
  bandShown: boolean
  /** Quackie slides in once the poster is in, rather than popping into an empty frame. */
  characterShown: boolean
  onPosterReady: () => void
  onLoopReady: () => void
}) {
  const panelX = useTransform(sx, v => v * -18)
  const panelY = useTransform(sy, v => v * -8)
  const charX = useTransform(sx, v => v * 8)
  const charY = useTransform(sy, v => v * 4)

  return (
    // Phones zoom onto the character; desktop covers the viewport anchored top-right,
    // so the panel and the video always share one coordinate space.
    <div
      aria-hidden
      className={cn(
        'absolute aspect-video',
        'bottom-0 left-[-74vw] w-[200vw]',
        'sm:left-[-40vw] sm:w-[150vw]',
        'lg:bottom-auto lg:left-auto lg:right-0 lg:top-0 lg:w-[max(100vw,calc(100svh*16/9))]',
      )}
    >
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, x: '14%' }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        <motion.div className="absolute inset-0" style={{ x: panelX, y: panelY }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, rgb(255 200 61 / 0.2) 1.5px, transparent 2px)',
              backgroundSize: '9px 9px',
              maskImage: 'radial-gradient(30% 48% at 47% 46%, #000 0%, transparent 72%)',
              WebkitMaskImage: 'radial-gradient(30% 48% at 47% 46%, #000 0%, transparent 72%)',
            }}
          />
          <svg viewBox="0 0 1280 720" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <polygon className={cn('fill-[var(--q-duck)]', !bandShown && 'opacity-0')} points={bandPoints(STARTING_SOON_BAND)} />
            <polygon className="fill-[var(--q-duck)]" points="664,-8 677,-8 602,170 589,170" />
            <polygon className="fill-[var(--q-duck)] opacity-55" points="641,-8 647,-8 597,110 591,110" />
          </svg>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0, x: 40 }}
        animate={characterShown ? { opacity: 1, x: 0 } : undefined}
        transition={{ duration: 1, delay: 0.25, ease: EASE }}
      >
        <motion.div className="absolute inset-0" style={{ x: charX, y: charY }}>
          <Character still={still} onPosterReady={onPosterReady} onLoopReady={onLoopReady} />
        </motion.div>
      </motion.div>
    </div>
  )
}

function Character({
  still,
  onPosterReady,
  onLoopReady,
}: {
  still: boolean
  onPosterReady: () => void
  onLoopReady: () => void
}) {
  const loopSrc = useLoopSrc(LOOP)
  const [playing, setPlaying] = useState(false)
  const showVideo = !still && loopSrc !== null

  return (
    // A hard offset shadow cuts the yellow hoodie out of the yellow panel.
    <div className="absolute inset-0 [filter:drop-shadow(-12px_7px_0_var(--q-bg))]">
      <Image
        src={POSTER}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 100vw, 200vw"
        onLoad={onPosterReady}
        className={cn('object-cover transition-opacity duration-300', playing && 'opacity-0')}
      />
      {showVideo && (
        <video
          src={loopSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlayThrough={onLoopReady}
          onPlaying={() => {
            setPlaying(true)
            onLoopReady()
          }}
          className={cn('absolute inset-0 size-full transition-opacity duration-300', playing ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </div>
  )
}

// ── Copy ─────────────────────────────────────────────────────────────────────

function Headline({
  sx,
  live,
  count,
  onReplay,
}: {
  sx: MotionValue<number>
  live: boolean
  count: number
  onReplay: () => void
}) {
  const x = useTransform(sx, v => v * -5)

  return (
    <motion.div
      style={{ x }}
      className={cn(
        'absolute inset-x-0 top-0 z-20 px-6 pt-32',
        'sm:px-[6.5vw] sm:pt-40 lg:top-1/2 lg:pt-0 lg:-translate-y-[54%]',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!live ? (
          <motion.div
            key="soon"
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className={cn('origin-bottom-left -rotate-[2.6deg]', hiddenIfSeen)}
          >
            <div className="relative w-fit text-[clamp(60px,10.4vw,190px)]">
              <h1 style={soonType} className="uppercase">
                <RevealLine delay={0.35}>Starting</RevealLine>
                <RevealLine delay={0.45}>Soon</RevealLine>
              </h1>
              <Flicks delay={1.05} className="text-[var(--q-cream)]" flicks={TITLE_FLICKS} />
            </div>

            <div className="relative mt-[0.04em] w-fit text-[clamp(96px,15.2vw,280px)]">
              <div
                style={countType}
                role="timer"
                aria-label={`Starting in ${count}`}
                className="h-[1em] origin-bottom-left -skew-x-[11deg] scale-x-[1.12] overflow-hidden text-[var(--q-duck)]"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    className="block"
                    initial={{ y: '55%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '-55%', opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    {String(count).padStart(2, '0')}
                  </motion.span>
                </AnimatePresence>
              </div>
              <Flicks delay={1.15} className="text-[var(--q-duck)]" flicks={COUNT_FLICKS} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="live">
            <h1 style={display} className="text-[clamp(48px,6.6vw,128px)] uppercase">
              <RevealLine delay={0.5}>Your co-host</RevealLine>
              <RevealLine delay={0.6}>
                is <span className="text-[var(--q-duck)]">on air.</span>
              </RevealLine>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
              className="mt-7 max-w-[34ch] text-[clamp(15px,1.2vw,19px)] leading-relaxed text-[var(--q-cream-dim)]"
            >
              Quackie reads your Twitch, Discord and Telegram chat and answers out loud — the moment a message lands.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9, ease: EASE }}
              className="mt-9 flex items-center gap-6"
            >
              <Link
                href={REGISTER_ROUTE}
                className={cn(
                  mono,
                  'inline-flex items-center gap-3 rounded-full bg-[var(--q-duck)] px-7 py-3.5',
                  'text-[15px] font-semibold text-[#1A1300] transition-transform duration-200 hover:-translate-y-0.5',
                )}
              >
                <span className="size-2 rounded-full bg-[#1A1300]" />
                Go live
              </Link>
              <button
                type="button"
                onClick={onReplay}
                className={cn(mono, 'text-[12px] tracking-[0.16em] text-[var(--q-cream-dim)] uppercase hover:text-[var(--q-cream)]')}
              >
                ↺ Replay
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Flicks({ flicks, delay, className }: { flicks: Flick[]; delay: number; className: string }) {
  return (
    <motion.div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay }}
    >
      {flicks.map(f => (
        <span
          key={`${f.left}-${f.top}`}
          className="absolute h-[0.034em] origin-left bg-current"
          style={{
            left: f.left,
            top: f.top,
            width: f.length,
            rotate: `${f.angle}deg`,
            clipPath: f.taper ? 'polygon(0 50%, 100% 0, 100% 100%)' : undefined,
          }}
        />
      ))}
    </motion.div>
  )
}

// ── Broadcast UI ─────────────────────────────────────────────────────────────

// REC sits inside the top-left frame corner like a viewfinder; once live, the
// page's header takes that corner and its duck hangs into it, so the LIVE tag drops
// below them (the jump happens under the stinger).
function OnAirBadge({ live }: { live: boolean }) {
  return (
    <div
      className={cn(
        mono,
        'absolute z-30',
        live
          ? 'left-6 top-[88px] sm:left-[6.5vw] sm:top-[128px]'
          : 'left-[34px] top-[32px] sm:left-[calc(2.2vw_+_22px)] sm:top-[calc(3.2vh_+_20px)]',
      )}
    >
      {live ? (
        <span className="inline-flex items-center gap-2 rounded-[4px] bg-[var(--q-red)] px-2.5 py-1 text-[13px] font-semibold tracking-[0.14em] text-[var(--q-cream)]">
          <span className="size-2 animate-pulse rounded-full bg-[var(--q-cream)]" />
          LIVE
        </span>
      ) : (
        <span className={cn('inline-flex items-center gap-2.5 text-[16px] tracking-[0.1em] text-[var(--q-red)]', hiddenIfSeen)}>
          <span className="size-3 animate-pulse rounded-full bg-[var(--q-red)] shadow-[0_0_12px_rgb(255_59_48/0.6)]" />
          REC
        </span>
      )}
    </div>
  )
}

// ── Stinger: a yellow duck panel sweeps across and hides the cut ────────────

function Stinger({ active, onDone }: { active: boolean; onDone: () => void }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="stinger"
          aria-hidden
          className="pointer-events-none absolute -inset-y-[10%] left-0 z-50 w-[200%] bg-[var(--q-duck)]"
          initial={{ x: '100%', skewX: -12 }}
          // Parks over the whole viewport for a beat so the cut underneath is never seen.
          animate={{ x: ['100%', '-25%', '-25%', '-100%'], skewX: -12 }}
          transition={{ duration: 1.2, times: [0, 0.4, 0.58, 1], ease: [EASE, 'linear', [0.65, 0, 0.35, 1]] }}
          onAnimationComplete={onDone}
        >
          {/* The mark's head is the stinger's own yellow, so only the face shows. */}
          <Image
            src="/logo/quackie/quackie-mark.svg"
            alt=""
            width={687}
            height={408}
            unoptimized
            className="absolute left-1/2 top-1/2 w-[30vmin] -translate-x-1/2 -translate-y-1/2 skew-x-12"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
