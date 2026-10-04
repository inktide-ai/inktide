'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE, RevealLine, digits, display, mono, useLoopSrc, useNearScreen, useSceneFocus, type LoopSources } from './broadcast'
import { CUSTOMIZE_GEOMETRY, customizeScreenPath } from './track'

// A scene that shows Quackie one way at a time, picked from a short row: the same
// character in several Flow loops, every loop starting from one shared pose, so a short
// yellow shutter is all it takes to hide the swap. Quackie stands in the cream screen the
// track draws; the copy and picker sit on the dark road beside it.

export type ShowcaseItem = {
  name: string
  /** Alt text for the still that shows until the loop plays. */
  alt: string
  /** The item's own art; a scene with a custom `stage` draws its art itself instead. */
  still?: string
  loop?: LoopSources
  /** The picker shows either a thumbnail of the loop or an icon. */
  thumb?: string
  icon?: ReactNode
}

/** A scene that keeps one figure and changes only part of it per item (Listen swaps the
 *  tablet's screen) draws its own stage instead of one loop per item, and needs no shutter.
 *  All three layers sit in the character's 16:9 frame; only `figure` gets the hard offset
 *  shadow, so the animated `overlay` doesn't make the browser redraw a filter every frame. */
export type ShowcaseStage = {
  backdrop?: ReactNode
  figure: ReactNode
  overlay?: (index: number, motion: { still: boolean; playing: boolean }) => ReactNode
}

export const loopFiles = (base: string): LoopSources => ({
  webm: { hd: `${base}-1440.webm`, sd: `${base}-1080.webm` },
  hevc: { hd: `${base}-1440-hevc.mov`, sd: `${base}-1080-hevc.mov` },
})

interface ShowcaseSceneProps {
  id: string
  chapter: string
  /** The section's name on its plate, next to the chapter number. */
  label: string
  ariaLabel: string
  /** The skewed tag over the headline, followed by the item count. */
  tag: string
  title: [ReactNode, ReactNode]
  body: ReactNode
  items: ShowcaseItem[]
  /** What one item is called, for the picker's buttons. */
  noun: string
  stage?: ShowcaseStage
  /** Overrides the character frame's size and place, e.g. to keep a wide figure in view on phones. */
  frameClassName?: string
}

// The shutter covers the character at this point of its sweep; the item swaps underneath.
const SWAP_MS = 230
// Until someone picks an item, the scene moves on to the next one by itself.
const AUTO_MS = 7000

const pct = (n: number) => `${n * 100}%`
const EMPTY_LOOP: LoopSources = { webm: { hd: '', sd: '' }, hevc: { hd: '', sd: '' } }
const pad = (n: number) => String(n).padStart(2, '0')

export default function ShowcaseScene({
  id,
  chapter,
  label,
  ariaLabel,
  tag,
  title,
  body,
  items,
  noun,
  stage,
  frameClassName,
}: ShowcaseSceneProps) {
  const ref = useRef<HTMLElement>(null)
  const { entered, focused } = useSceneFocus(ref)
  const near = useNearScreen(ref)
  const reduceMotion = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)
  const [shutter, setShutter] = useState(0)
  const [touched, setTouched] = useState(false)
  const swapping = useRef(false)

  const swap = (next: number) => {
    const to = (next + items.length) % items.length
    if (to === index || swapping.current) return
    if (reduceMotion || stage) return setIndex(to)
    swapping.current = true
    setShutter(s => s + 1)
    window.setTimeout(() => {
      setIndex(to)
      swapping.current = false
    }, SWAP_MS)
  }

  const pick = (next: number) => {
    setTouched(true)
    swap(next)
  }

  const autoplay = focused && !touched && !reduceMotion
  useEffect(() => {
    if (!autoplay) return
    const timer = window.setTimeout(() => swap(index + 1), AUTO_MS)
    return () => window.clearTimeout(timer)
  })

  const item = items[index]

  // The desktop shutter is clipped to the cream screen, the very path the track draws,
  // rounded corners and all; it needs the scene's size in pixels to build it.
  const [screenClip, setScreenClip] = useState<string | undefined>()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setScreenClip(`path('${customizeScreenPath(el.offsetWidth, el.offsetHeight)}')`))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      id={id}
      data-chapter={chapter}
      data-track-scene
      aria-label={ariaLabel}
      // One unit of a 16:9 stage that fits the viewport: on screens wider than 16:9,
      // sizes follow the height, so the copy never runs down into the plate.
      style={{ '--u': 'min(1vw, 1.7778svh)', '--screen-top': pct(CUSTOMIZE_GEOMETRY.screenTop) } as CSSProperties}
      className={cn(
        'relative isolate h-[100svh] min-h-[720px] w-full overflow-hidden lg:snap-start',
        // On desktop the track paints the ground and the slabs.
        'bg-[var(--q-bg)] text-[var(--q-cream)] lg:bg-transparent',
      )}
    >
      {/* The item's name, set huge and barely there on the road, like a watermark. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={item.name}
          aria-hidden
          style={{ ...display, textShadow: 'none' }}
          className="pointer-events-none absolute left-[-1vw] top-[3%] hidden text-[calc(var(--u)*17)] uppercase text-[rgb(255_248_231/0.045)] lg:block"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {item.name}
        </motion.span>
      </AnimatePresence>

      {/* Quackie: the source frame crops the top of the hood, so the frame's top edge
          sits on the screen's top edge and reads as the window, not a cut. */}
      <div
        className={cn(
          'absolute bottom-0 right-[-3vw] aspect-video w-[190vw] lg:top-[var(--screen-top)] lg:w-auto',
          frameClassName,
        )}
      >
        {stage?.backdrop}
        <div className="absolute inset-0 [filter:drop-shadow(-10px_6px_0_var(--q-bg))]">
          {stage ? stage.figure : <Look item={item} still={reduceMotion} load={near} />}
        </div>
        {stage?.overlay?.(index, { still: reduceMotion, playing: focused && !reduceMotion })}
        {/* Phones: the copy sits above Quackie, so the frame itself can clip the shutter. */}
        {!stage && (
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
            <ShutterBar run={shutter} className="left-[30%] w-[90%]" />
          </div>
        )}
      </div>

      {/* Desktop: the frame runs in under the copy, so the shutter is cut to the screen's
          own shape instead and wipes only the window Quackie stands in. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block" style={{ clipPath: screenClip }}>
        <ShutterBar run={shutter} className="left-[35%] w-[75%]" />
      </div>

      {/* The track starts the yellow plate below this column, wherever it ends. */}
      <div
        data-track-anchor
        className="relative z-10 px-6 pt-24 sm:px-[6.5vw] lg:absolute lg:left-0 lg:top-[16%] lg:w-[40vw] lg:p-0 lg:pl-[6.5vw]"
      >
        <span className={cn(mono, 'inline-block -skew-x-12 bg-[var(--q-cream)] px-2 py-0.5 text-[12px] tracking-[0.14em] text-[var(--q-bg)]')}>
          {tag} · {pad(index + 1)}/{pad(items.length)}
        </span>

        <h2 style={display} className="mt-5 text-[clamp(52px,6.4vw,120px)] uppercase lg:text-[calc(var(--u)*6.4)]">
          <RevealLine delay={0.1} play={entered}>
            {title[0]}
          </RevealLine>
          <RevealLine delay={0.2} play={entered}>
            {title[1]}
          </RevealLine>
        </h2>

        <p className="mt-6 max-w-[34ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-[var(--q-cream-dim)]">{body}</p>

        <Picker items={items} noun={noun} index={index} onPick={pick} className="mt-8" />
      </div>

      {/* Scene number on the yellow plate, the way ZZZ labels its sections. */}
      <div className="pointer-events-none absolute bottom-[4.5%] left-[6.5vw] hidden text-[var(--q-bg)] lg:block">
        <div style={{ ...display, textShadow: 'none', fontStretch: '84%' }} className="text-[calc(var(--u)*2.6)] uppercase">
          {label}
        </div>
        <div style={digits} className="origin-bottom-left -skew-x-[11deg] text-[calc(var(--u)*9)]">
          {chapter}
        </div>
      </div>
    </section>
  )
}

/** `load` stays off until the scene comes near, so the loop isn't fetched with the hero. */
function Look({ item, still, load }: { item: ShowcaseItem; still: boolean; load: boolean }) {
  const loopSrc = useLoopSrc(item.loop ?? EMPTY_LOOP)
  const [playing, setPlaying] = useState<string | null>(null)
  const live = playing === item.name

  return (
    <>
      {item.still && <Image
        key={item.still}
        src={item.still}
        alt={item.alt}
        fill
        sizes="(min-width: 1024px) 90vw, 190vw"
        className={cn('object-cover', live && 'opacity-0')}
      />}
      {!still && load && item.loop && loopSrc && (
        <video
          key={`${item.name}:${loopSrc}`}
          src={loopSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onPlaying={() => setPlaying(item.name)}
          className={cn('absolute inset-0 size-full', live ? 'opacity-100' : 'opacity-0')}
        />
      )}
    </>
  )
}

/** A skewed yellow bar that wipes across the character and hides the swap; its
 *  parent clips it, so it enters and leaves past that edge. */
function ShutterBar({ run, className }: { run: number; className: string }) {
  if (run === 0) return null
  return (
    <motion.div
      key={run}
      className={cn('absolute inset-y-[-4%] bg-[var(--q-duck)]', className)}
      initial={{ x: '110%', skewX: -14 }}
      animate={{ x: ['110%', '0%', '0%', '-160%'] }}
      transition={{ duration: 0.62, times: [0, 0.36, 0.48, 1], ease: [EASE, 'linear', [0.65, 0, 0.35, 1]] }}
    />
  )
}

function Picker({
  items,
  noun,
  index,
  onPick,
  className,
}: {
  items: ShowcaseItem[]
  noun: string
  index: number
  onPick: (i: number) => void
  className?: string
}) {
  const arrow = 'grid size-10 place-items-center rounded-full text-[var(--q-cream)] transition-colors hover:bg-white/10'
  return (
    <div className={cn('flex w-fit items-center gap-2 rounded-full bg-[#0B0D12] p-2 ring-1 ring-[rgb(255_248_231/0.12)]', className)}>
      <button type="button" aria-label={`Previous ${noun}`} onClick={() => onPick(index - 1)} className={arrow}>
        <ChevronLeft className="size-5" />
      </button>
      {items.map((it, i) => (
        <button
          key={it.name}
          type="button"
          aria-label={it.name}
          aria-pressed={i === index}
          onClick={() => onPick(i)}
          className={cn(
            'relative grid size-16 place-items-center overflow-hidden rounded-xl border-2 transition-[opacity,border-color] duration-300',
            it.thumb ? '' : 'bg-[var(--q-bg)] text-[var(--q-cream)]',
            i === index ? 'border-[var(--q-duck)]' : 'border-transparent opacity-55 hover:opacity-90',
          )}
        >
          {it.thumb ? <Image src={it.thumb} alt="" fill sizes="64px" className="object-cover" /> : <span className="size-7">{it.icon}</span>}
        </button>
      ))}
      <button type="button" aria-label={`Next ${noun}`} onClick={() => onPick(index + 1)} className={arrow}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
