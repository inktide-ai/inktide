'use client'

import Image from 'next/image'
import { ListenOverlay, TWITCH_GLYPH, type Platform } from './listen-screens'
import ShowcaseScene, { type ShowcaseItem, type ShowcaseStage } from './showcase-scene'
import { SOCIALS } from './stream-footer'

// Scene 01: Quackie listens to chat from every platform at once. One keyed still of Quackie
// with a tablet; each platform's app is drawn in code onto the tablet's screen, and the
// picker only swaps what the screen shows.

/** The keyed still: 2560×1440, Quackie sitting in its right two thirds. */
const ART = { src: '/images/landing/listen/quackie-tablet.png', w: 2560, h: 1440 }

type Pt = [number, number]
const frac = ([x, y]: Pt): Pt => [x / ART.w, y / ART.h]

/** The screen's corners in the still (top-left, top-right, bottom-right, bottom-left), from
 *  lines fitted to its four edges, so the app lands exactly on the glass. */
const SCREEN: Pt[] = [
  [1265.9, 409.2],
  [1602.9, 266.8],
  [1692.5, 500.2],
  [1369.1, 649.3],
].map(p => frac(p as Pt))

/** The sleeve and hand that hold the tablet's lower-left corner, cut out of the still so
 *  they stay in front of the app. */
const HAND = { src: '/images/landing/listen/tablet-hand.png', left: 1343, top: 592, w: 74, h: 61 }

/** Where the message card's tail points: above the tablet's top edge, high enough that the
 *  card clears the tilted tablet, and far enough left that it clears Quackie's face. */
const CARD_AT = frac([1500, 257])

const YOUTUBE =
  'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'

const glyph = (d: string) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-full">
    <path d={d} />
  </svg>
)

const PLATFORMS: (ShowcaseItem & { id: Platform })[] = [
  { id: 'twitch', name: 'Twitch', alt: '', icon: glyph(TWITCH_GLYPH) },
  { id: 'telegram', name: 'Telegram', alt: '', icon: SOCIALS.find(s => s.label === 'Telegram')?.icon },
  { id: 'youtube', name: 'YouTube', alt: '', icon: glyph(YOUTUBE) },
]

const pct = (n: number) => `${n * 100}%`

const STAGE: ShowcaseStage = {
  // A soft shadow on the floor under Quackie, so the cut-out sits down instead of floating.
  backdrop: (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-[12%] bottom-[-3%] h-[16%] bg-[radial-gradient(50%_50%_at_58%_50%,rgb(16_19_26/0.28),transparent_70%)]"
    />
  ),
  figure: (
    <Image
      src={ART.src}
      alt="Quackie sitting on the floor with a tablet, looking up over the shoulder"
      fill
      sizes="(min-width: 1024px) 90vw, 150vw"
      className="object-cover"
    />
  ),
  overlay: (index, { still, playing }) => (
    <ListenOverlay key={PLATFORMS[index].id} platform={PLATFORMS[index].id} playing={playing} still={still} quad={SCREEN} cardAt={CARD_AT}>
      <Image
        src={HAND.src}
        alt=""
        width={HAND.w}
        height={HAND.h}
        unoptimized
        className="pointer-events-none absolute h-auto max-w-none"
        style={{ left: pct(HAND.left / ART.w), top: pct(HAND.top / ART.h), width: pct(HAND.w / ART.w) }}
      />
    </ListenOverlay>
  ),
}

export default function ListenScene() {
  return (
    <ShowcaseScene
      id="listen"
      chapter="01"
      label="Listen"
      ariaLabel="Quackie listens to every chat"
      tag="SOURCE"
      title={[
        'Every chat.',
        <>
          One <span className="text-[var(--q-duck)]">ear.</span>
        </>,
      ]}
      body="Chat from every platform in one feed. Quackie reads each message as it lands."
      items={PLATFORMS}
      noun="platform"
      stage={STAGE}
      // Phones: a narrower frame keeps the tablet and most of Quackie on screen.
      frameClassName="w-[150vw] right-[-8vw]"
    />
  )
}
