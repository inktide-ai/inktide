'use client'

import localFont from 'next/font/local'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/utils'

// Shared pieces of the "the site is a stream" landing: palette, type and the
// broadcast frame every scene sits in.

export const EASE = [0.22, 1, 0.36, 1] as const
export const FPS = 24

// The display faces go through next/font so their files are preloaded with the page,
// and the headlines wait for them (`block`) instead of first flashing a fallback face.
const monaItalic = localFont({
  src: '../../../node_modules/@fontsource-variable/mona-sans/files/mona-sans-latin-wdth-italic.woff2',
  weight: '200 900',
  style: 'italic',
  display: 'block',
  declarations: [{ prop: 'font-stretch', value: '75% 125%' }],
  fallback: ['sans-serif'],
})

const bungee = localFont({
  src: '../../../node_modules/@fontsource/bungee/files/bungee-latin-400-normal.woff2',
  weight: '400',
  display: 'block',
  fallback: ['sans-serif'],
})

export const palette = {
  '--q-bg': '#10131A',
  '--q-cream': '#FFF8E7',
  '--q-cream-dim': 'rgb(255 248 231 / 0.62)',
  '--q-duck': '#FFC83D',
  '--q-red': '#FF3B30',
} as CSSProperties

export const display: CSSProperties = {
  fontFamily: monaItalic.style.fontFamily,
  fontStyle: 'italic',
  fontWeight: 900,
  fontStretch: '75%',
  lineHeight: 0.86,
  letterSpacing: '-0.015em',
  // A hard offset shadow keeps cream type legible where it crosses the yellow panel.
  textShadow: '-0.035em 0.03em 0 var(--q-bg)',
}

/** Squared-off digits for scene numbers and the countdown. */
export const digits: CSSProperties = {
  fontFamily: bungee.style.fontFamily,
  lineHeight: 1,
  letterSpacing: '-0.03em',
}

export const mono = 'font-[family-name:var(--font-geist-mono)]'

/** The track's timeline ribbon as a flat strip: cream, ruler ticks, every fifth long.
 *  Sections lay it over the seam above them, hiding wherever the scene above is cut off. */
export const ribbonStrip: CSSProperties = {
  backgroundColor: 'var(--q-cream)',
  backgroundImage:
    'repeating-linear-gradient(90deg, var(--q-bg) 0 4px, transparent 4px 110px), repeating-linear-gradient(90deg, var(--q-bg) 0 4px, transparent 4px 22px)',
  backgroundSize: '100% 28px, 100% 14px',
  backgroundPosition: '0 center, 0 center',
  backgroundRepeat: 'no-repeat',
}

/** The track's hatched slab, for sections that draw their own piece of road. */
export const hatch: CSSProperties = {
  backgroundImage: 'repeating-linear-gradient(-48deg, #171B26 0 6px, #212734 6px 9px)',
}

// ── The yellow band ──────────────────────────────────────────────────────────

/** The yellow band a scene owns, in its stage box's 1280×720 space, corners in
 *  TL, TR, BR, BL order. Stage boxes cover the viewport: `right` boxes hang off
 *  the top-right corner, `center` boxes are centred. Between scenes the deck morphs
 *  one band into the next, so they read as one object travelling through the site. */
export type Band = { anchor: 'right' | 'center'; points: [number, number][] }

export const STARTING_SOON_BAND: Band = {
  anchor: 'right',
  points: [[699, -8], [1072, -8], [1149, 735], [385, 735]],
}

export const CHAT_BAND: Band = {
  anchor: 'center',
  points: [[150, -10], [410, -10], [190, 730], [-70, 730]],
}

export const bandPoints = (band: Band) => band.points.map(p => p.join(',')).join(' ')

// ── Scene state ──────────────────────────────────────────────────────────────

/** Provided by the desktop scene deck; absent on phones, where scenes just scroll. */
export type SceneState = {
  /** This scene is on screen, or is the one arriving. */
  active: boolean
  /** On screen with no transition running. The deck flies the yellow band between
   *  scenes, so each scene shows its own copy of the band only once settled. */
  settled: boolean
  /** Has been on screen at least once. */
  entered: boolean
  count: number
  goTo: (index: number) => void
}

export const SceneContext = createContext<SceneState | null>(null)

export function useSceneState(): SceneState | null {
  return useContext(SceneContext)
}

/** Whether a scene is on screen: from the deck on desktop, from scroll position on phones. */
export function useSceneFocus(ref: RefObject<Element | null>) {
  const deck = useSceneState()
  const seen = useInView(ref, { once: true, amount: 0.35 })
  const watching = useInView(ref, { amount: 0.5 })
  if (deck) return { entered: deck.entered, focused: deck.active, settled: deck.settled }
  return { entered: seen, focused: watching, settled: true }
}

/** Whether a scene has come within a screen of the viewport: the point to start fetching
 *  its loops, so they are ready by the time it arrives and don't compete with the hero's. */
export function useNearScreen(ref: RefObject<Element | null>) {
  return useInView(ref, { once: true, margin: '100% 0px' })
}

// ── Keyed character loops ────────────────────────────────────────────────────

export type LoopSources = {
  webm: { hd: string; sd: string }
  hevc: { hd: string; sd: string }
}

// WebKit (Safari and every iOS browser) only composites alpha from HEVC;
// everything else reads the alpha channel from VP9. Phones get the 1080p cut.
function pickLoopSrc(loop: LoopSources): string {
  const ua = navigator.userAgent
  const webkitOnly = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua)
  const set = webkitOnly ? loop.hevc : loop.webm
  return window.matchMedia('(min-width: 1024px)').matches ? set.hd : set.sd
}

const subscribeNever = () => () => {}

/** The loop file this browser can play with alpha; null while server rendering. */
export function useLoopSrc(loop: LoopSources): string | null {
  return useSyncExternalStore(subscribeNever, () => pickLoopSrc(loop), () => null)
}

// ── Frame ────────────────────────────────────────────────────────────────────

/** `topClassName` moves the upper corners, e.g. below a header. */
export function Corners({ className, topClassName }: { className?: string; topClassName?: string }) {
  const base = cn('pointer-events-none absolute z-30 size-8 border-[var(--q-duck)] sm:size-10', className)
  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0, scale: 1.04 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, ease: EASE }}
      className="pointer-events-none absolute inset-0 z-30"
    >
      <span className={cn(base, 'left-4 top-4 border-l-2 border-t-2 sm:left-[2.2vw] sm:top-[3.2vh]', topClassName)} />
      <span className={cn(base, 'right-4 top-4 border-r-2 border-t-2 sm:right-[2.2vw] sm:top-[3.2vh]', topClassName)} />
      {/* On desktop the track's ribbon runs along the bottom edge, so the lower corners sit above it. */}
      <span className={cn(base, 'bottom-4 left-4 border-b-2 border-l-2 sm:bottom-[3.2vh] sm:left-[2.2vw] lg:bottom-[calc(3.2vh+28px)]')} />
      <span className={cn(base, 'bottom-4 right-4 border-b-2 border-r-2 sm:bottom-[3.2vh] sm:right-[2.2vw] lg:bottom-[calc(3.2vh+28px)]')} />
    </motion.div>
  )
}

/** Scenes in running order; the pager lights the one on screen. */
export const SCENES = ['00', '02', '03', '04', '06'] as const

export function PagerMarks({ active, dark = false }: { active: number; dark?: boolean }) {
  const deck = useSceneState()
  return (
    <>
      <span className={cn('text-[12px] leading-snug tracking-[0.1em]', dark ? 'text-[var(--q-bg)]' : 'text-[var(--q-duck)]')}>
        SCENE
        <br />
        {SCENES[active]} – {SCENES[SCENES.length - 1]}
      </span>
      <span className="mt-4 grid gap-3">
        {SCENES.map((scene, i) => {
          const dot = cn(
            'block size-[9px] rounded-full border-[1.5px]',
            i === active
              ? 'border-[var(--q-duck)] bg-[var(--q-duck)]'
              : dark
                ? 'border-[rgb(16_19_26/0.45)]'
                : 'border-[rgb(255_248_231/0.55)]',
          )
          // Dots jump between scenes once the deck has them; the rest are still to come.
          return deck && i < deck.count && i !== active ? (
            <button
              key={scene}
              type="button"
              aria-label={`Scene ${scene}`}
              onClick={() => deck.goTo(i)}
              className={cn(dot, 'transition-colors hover:border-[var(--q-duck)]')}
            />
          ) : (
            <span key={scene} className={dot} />
          )
        })}
      </span>
    </>
  )
}

// HH:MM:SS:FF since the page opened. Written straight to the DOM so a 60 Hz
// clock never re-renders the scene.
export function Timecode() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      const frames = Math.floor((now / 1000) * FPS)
      const s = Math.floor(frames / FPS)
      const parts = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60, frames % FPS]
      if (ref.current) ref.current.textContent = parts.map(n => String(n).padStart(2, '0')).join(':')
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <span ref={ref}>00:00:00:00</span>
}

/** A line that slides up out of its own mask. It keeps its height while hidden, so
 *  `play` can wait for the scene to come on screen without shifting the layout. */
export function RevealLine({ children, delay, play = true }: { children: ReactNode; delay: number; play?: boolean }) {
  return (
    <span className="block overflow-hidden pb-[0.06em] pr-[0.12em]">
      <motion.span
        className="block"
        initial={{ y: '105%' }}
        animate={{ y: play ? 0 : '105%' }}
        transition={{ duration: 0.8, delay, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  )
}
