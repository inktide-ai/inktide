'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EASE, RevealLine, digits, display, hatch, mono, ribbonStrip, useLoopSrc, useNearScreen, useSceneFocus, type LoopSources } from './broadcast'

// Scene 03 (talk): clips from the stream, laid out like the videos block on the ZZZ site —
// a big player, the clip's tag and title, and a rail of thumbnails. It is where
// recordings of Quackie answering a real chat go; the shot does the explaining.

type Clip = {
  tag: string
  title: string
  poster: string
  loop: LoopSources
}

const loopFiles = (base: string): LoopSources => ({
  webm: { hd: `${base}-1440.webm`, sd: `${base}-1080.webm` },
  hevc: { hd: `${base}-1440-hevc.mov`, sd: `${base}-1080-hevc.mov` },
})

// Placeholders: the keyed character loops stand in until there are recordings of
// the product on stream. Those will be opaque clips with sound and burned-in subtitles.
const CLIPS: Clip[] = [
  {
    tag: 'Twitch',
    title: 'Reads the chat, laughs along',
    poster: '/images/landing/chat/still-laugh.png',
    loop: loopFiles('/videos/landing/chat-loop'),
  },
  {
    tag: 'Discord',
    title: 'Plotting something',
    poster: '/images/landing/costumes/still-raccoon.png',
    loop: loopFiles('/videos/landing/costume-raccoon-loop'),
  },
  {
    tag: 'Telegram',
    title: 'Chomp!',
    poster: '/images/landing/costumes/still-shark.png',
    loop: loopFiles('/videos/landing/costume-shark-loop'),
  },
  {
    tag: 'Twitch',
    title: 'Starting soon',
    poster: '/images/landing/starting-soon-poster.png',
    loop: loopFiles('/videos/landing/starting-soon-loop'),
  },
]

const flat = { ...display, textShadow: 'none' }

export default function ClipsScene() {
  const ref = useRef<HTMLElement>(null)
  const { entered, focused } = useSceneFocus(ref)
  const near = useNearScreen(ref)
  const reduceMotion = useReducedMotion() ?? false
  const [index, setIndex] = useState(0)
  // Null until someone presses play or pause; until then clips play unless motion is reduced.
  const [paused, setPaused] = useState<boolean | null>(null)

  const pick = (next: number) => setIndex((next + CLIPS.length) % CLIPS.length)
  const clip = CLIPS[index]

  return (
    <section
      ref={ref}
      id="clips"
      data-chapter="03"
      aria-label="Clips from the stream"
      // Stage units, as in the other scenes: sizes follow the height on screens wider than 16:9.
      style={{ '--u': 'min(1vw, 1.7778svh)' } as CSSProperties}
      className={cn(
        // Clipped to the section except upwards, so the ribbon can lie over the seam above.
        'relative isolate [clip-path:inset(-30px_0_0_0)] bg-[var(--q-bg)] pb-20 pt-28 text-[var(--q-cream)]',
        'lg:h-[100svh] lg:min-h-[720px] lg:snap-start lg:p-0',
      )}
    >
      <div aria-hidden style={ribbonStrip} className="absolute inset-x-0 top-0 z-20 h-[46px] -translate-y-1/2">
        <span
          style={digits}
          className="absolute right-[22%] top-1/2 grid h-[58px] w-[68px] -translate-y-1/2 place-items-center rounded-[10px] bg-[var(--q-duck)] text-[30px] text-[var(--q-bg)]"
        >
          03
        </span>
      </div>

      {/* A piece of hatched road behind the player, and the yellow plate the scene's copy
          and number sit on. Both lean at the track's angle. */}
      <div
        aria-hidden
        style={hatch}
        className="pointer-events-none absolute -left-[14%] bottom-[24%] top-[7%] -z-10 hidden w-[62%] -skew-x-[22.8deg] rounded-[44px] lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[14%] bottom-[3%] top-[14%] -z-10 hidden w-[calc(14%+var(--u)*44)] -skew-x-[22.8deg] rounded-[44px] bg-[var(--q-duck)] lg:block"
      />

      <div className="px-6 sm:px-[6.5vw] lg:absolute lg:right-[5vw] lg:top-[19%] lg:w-[calc(var(--u)*24)] lg:p-0 lg:text-[var(--q-bg)]">
        <span
          className={cn(
            mono,
            'inline-block -skew-x-12 bg-[var(--q-cream)] px-2 py-0.5 text-[12px] tracking-[0.14em] text-[var(--q-bg)] lg:bg-[var(--q-bg)] lg:text-[var(--q-duck)]',
          )}
        >
          CLIP · {String(index + 1).padStart(2, '0')}/{String(CLIPS.length).padStart(2, '0')}
        </span>
        {/* Dark type on the yellow plate needs no offset shadow; cream type on phones does. */}
        <h2
          style={{ ...display, textShadow: 'var(--clips-shadow)' }}
          className="mt-5 text-[clamp(52px,6.4vw,120px)] uppercase [--clips-shadow:-0.035em_0.03em_0_var(--q-bg)] lg:text-[calc(var(--u)*4.2)] lg:[--clips-shadow:none]"
        >
          <RevealLine delay={0.1} play={entered}>
            Chat asks.
          </RevealLine>
          <RevealLine delay={0.2} play={entered}>
            Quackie
          </RevealLine>
          <RevealLine delay={0.3} play={entered}>
            answers.
          </RevealLine>
        </h2>
        <p className="mt-5 max-w-[34ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-[var(--q-cream-dim)] lg:text-[calc(var(--u)*1.15)] lg:text-[rgb(16_19_26/0.78)]">
          A viewer writes, Quackie reads it and answers out loud, right on stream.
        </p>
      </div>

      <div className="mt-10 px-4 sm:px-[6.5vw] lg:absolute lg:left-[6.5vw] lg:top-[14%] lg:mt-0 lg:w-[calc(var(--u)*62)] lg:p-0">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={entered ? { opacity: 1, x: 0 } : undefined}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <Player
            clip={clip}
            load={near}
            playing={focused && !(paused ?? reduceMotion)}
            onToggle={() => setPaused(!(paused ?? reduceMotion))}
          />
          <Rail index={index} onPick={pick} className="mt-[calc(var(--u)*1.6)]" />
        </motion.div>
      </div>

      {/* Scene number on the yellow plate, the way ZZZ labels its sections. */}
      <div className="pointer-events-none absolute bottom-[8%] right-[5vw] hidden text-right text-[var(--q-bg)] lg:block">
        <div style={{ ...flat, fontStretch: '84%' }} className="text-[calc(var(--u)*2.6)] uppercase">
          Talk
        </div>
        <div style={digits} className="origin-bottom-right -skew-x-[11deg] text-[calc(var(--u)*9)]">
          03
        </div>
      </div>
    </section>
  )
}

/** The stream scene the keyed placeholder loops play over: dark ground, halftone
 *  and a slanted yellow panel behind the character, as on the starting-soon screen. */
function Backdrop() {
  return (
    <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_100%_at_70%_35%,#1E2433_0%,#10131A_70%)]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgb(255 200 61 / 0.18) 1.5px, transparent 2px)',
          backgroundSize: '9px 9px',
          maskImage: 'radial-gradient(40% 60% at 62% 45%, #000 0%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(40% 60% at 62% 45%, #000 0%, transparent 72%)',
        }}
      />
      <svg viewBox="0 0 1280 720" preserveAspectRatio="none" className="absolute inset-0 size-full">
        <polygon className="fill-[var(--q-duck)]" points="869,-8 1109,-8 800,728 560,728" />
      </svg>
    </div>
  )
}

function Player({
  clip,
  load,
  playing,
  onToggle,
}: {
  clip: Clip
  /** Off until the scene comes within a screen of the viewport, so the clip isn't fetched up front. */
  load: boolean
  playing: boolean
  onToggle: () => void
}) {
  const src = useLoopSrc(clip.loop)
  const video = useRef<HTMLVideoElement>(null)
  // Which clip is actually showing frames; its poster covers the switch until then.
  const [live, setLive] = useState<string | null>(null)
  const showing = live === clip.title

  useEffect(() => {
    const v = video.current
    if (!v) return
    if (playing) v.play().catch(() => {})
    else v.pause()
  }, [playing, src, load])

  return (
    <div className="relative aspect-video overflow-hidden rounded-[22px] bg-[var(--q-bg)] shadow-[-12px_10px_0_0_#0B0D12] ring-1 ring-[rgb(255_248_231/0.14)] lg:rounded-[28px]">
      <Backdrop />
      {/* A hard offset shadow cuts the yellow hoodie out of the yellow panel. */}
      <div className="absolute inset-0 [filter:drop-shadow(-10px_6px_0_var(--q-bg))]">
        <Image
          key={clip.poster}
          src={clip.poster}
          alt=""
          fill
          sizes="(min-width: 1024px) 62vw, 100vw"
          className={cn('object-cover', showing && 'opacity-0')}
        />
        {load && src && (
          <video
            ref={video}
            key={src}
            src={src}
            muted
            loop
            playsInline
            preload="auto"
            onPlaying={() => setLive(clip.title)}
            className={cn('absolute inset-0 size-full', showing ? 'opacity-100' : 'opacity-0')}
          />
        )}
      </div>

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2.5 sm:left-6 sm:top-6">
        <button
          type="button"
          aria-label={playing ? 'Pause clip' : 'Play clip'}
          onClick={onToggle}
          className="grid size-11 place-items-center rounded-[10px] bg-[var(--q-duck)] text-[var(--q-bg)] ring-2 ring-[var(--q-bg)] transition-transform duration-200 hover:-translate-y-0.5"
        >
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <span className={cn(mono, 'flex items-center gap-2 rounded-full bg-[#0B0D12]/85 px-4 py-2.5 text-[13px] tracking-[0.1em] ring-1 ring-[rgb(255_248_231/0.14)]')}>
          <span className="size-2 rounded-full bg-[var(--q-red)]" />
          REPLAY
        </span>
      </div>

      {/* The clip's caption, on a dark strip along the bottom edge. */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end gap-3 bg-[linear-gradient(to_top,rgb(11_13_18/0.92),rgb(11_13_18/0.6)_60%,transparent)] px-4 pb-4 pt-12 sm:px-6 sm:pb-5">
        <span className={cn(mono, 'shrink-0 rounded-full bg-[var(--q-duck)] px-2.5 py-0.5 text-[12px] font-semibold tracking-[0.06em] text-[var(--q-bg)]')}>
          {clip.tag}
        </span>
        <span style={flat} className="truncate text-[clamp(18px,1.9vw,30px)] uppercase leading-none">
          {clip.title}
        </span>
      </div>
    </div>
  )
}

function Rail({ index, onPick, className }: { index: number; onPick: (i: number) => void; className?: string }) {
  const arrow = 'grid size-10 shrink-0 place-items-center rounded-full text-[var(--q-cream)] transition-colors hover:bg-white/10'
  return (
    <div
      className={cn(
        'flex w-fit max-w-full items-center gap-2 rounded-full bg-[#0B0D12] p-2 ring-1 ring-[rgb(255_248_231/0.12)] lg:ml-auto',
        className,
      )}
    >
      <button type="button" aria-label="Previous clip" onClick={() => onPick(index - 1)} className={arrow}>
        <ChevronLeft className="size-5" />
      </button>
      <div className="flex min-w-0 gap-2 overflow-x-auto">
        {CLIPS.map((c, i) => (
          <button
            key={c.title}
            type="button"
            aria-label={c.title}
            aria-pressed={i === index}
            onClick={() => onPick(i)}
            className={cn(
              'relative aspect-video w-[88px] shrink-0 overflow-hidden rounded-xl border-2 transition-[opacity,border-color] duration-300 sm:w-[112px]',
              i === index ? 'border-[var(--q-duck)]' : 'border-transparent opacity-55 hover:opacity-90',
            )}
          >
            <Backdrop />
            <Image src={c.poster} alt="" fill sizes="112px" className="object-cover" />
          </button>
        ))}
      </div>
      <button type="button" aria-label="Next clip" onClick={() => onPick(index + 1)} className={arrow}>
        <ChevronRight className="size-5" />
      </button>
    </div>
  )
}
