'use client'

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE } from './broadcast'

// The tablet in scene 01: each platform's app drawn in code and laid onto the tablet's
// screen in perspective, with chat arriving one message at a time. The tablet is small on
// the page, so each new message also pops out above it as a card big enough to read.

export type Platform = 'twitch' | 'telegram' | 'youtube'
type Pt = [number, number]

/** The app is laid out at this size, then mapped onto the screen's four corners. */
const DESIGN = { w: 560, h: 392 }

// ── Chat ─────────────────────────────────────────────────────────────────────

type Msg = { id: number; name: string; color: string; text: string; tip?: string }
type Line = Omit<Msg, 'id'>

const CHAT: Record<Platform, Line[]> = {
  twitch: [
    { name: 'kot_enjoyer', color: '#FF7F50', text: 'gg that clutch was insane' },
    { name: 'mira_bakes', color: '#9ACD32', text: 'quackie say hi to my mom 👋' },
    { name: 'oleg_plays', color: '#1E90FF', text: 'what are we playing next?' },
    { name: 'sasha', color: '#FF69B4', text: 'KEKW' },
    { name: 'dimon_tv', color: '#DAA520', text: 'first time here, love the vibe' },
    { name: 'nightowl', color: '#B57EDC', text: 'can you read my name? 🦉' },
    { name: 'pixel_pan', color: '#00CED1', text: 'clip that 😂' },
  ],
  telegram: [
    { name: 'Vova', color: '#E17076', text: 'watching from the bus lol' },
    { name: 'Lera', color: '#7BC862', text: 'can you drop the clip here?' },
    { name: 'Kirill', color: '#65AADD', text: 'stream tonight? 👀' },
    { name: 'Nastya', color: '#EE7AAE', text: 'the duck hoodie is back!!' },
    { name: 'Ilya', color: '#FAA774', text: 'good luck with the boss 🍀' },
    { name: 'Sonya', color: '#6EC9CB', text: 'morning everyone ☀️' },
  ],
  youtube: [
    { name: 'Anya K.', color: '#E57373', text: 'good luck tonight!' },
    { name: 'Max', color: '#64B5F6', text: 'only caught the end, what happened?' },
    { name: 'Leo', color: '#81C784', text: 'hello from Brazil 🇧🇷' },
    { name: 'Ren', color: '#FFB74D', text: 'keep it up quackie!', tip: '$5.00' },
    { name: 'Tanya', color: '#BA68C8', text: 'your voice is so calm' },
    { name: 'Mark', color: '#4DD0E1', text: 'subbed, see you next stream' },
  ],
}

let nextId = 1

/** The platform's chat: a few messages already there, then one more every few seconds while playing. */
function useChat(platform: Platform, playing: boolean) {
  const pool = CHAT[platform]
  const cursor = useRef(4)
  const [log, setLog] = useState<Msg[]>(() => pool.slice(0, 4).map(m => ({ ...m, id: nextId++ })))
  const [latest, setLatest] = useState<Msg | null>(null)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      const msg = { ...pool[cursor.current++ % pool.length], id: nextId++ }
      setLog(l => [...l.slice(-7), msg])
      setLatest(msg)
    }, 2800)
    return () => window.clearInterval(timer)
  }, [pool, playing])

  return { log, latest }
}

// ── Perspective ──────────────────────────────────────────────────────────────

/** CSS matrix3d that maps a w×h box at the origin onto the quad tl, tr, br, bl (Heckbert's
 *  square-to-quad projection, with the box scaled to the unit square first). */
function quadTransform(w: number, h: number, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: Pt[]) {
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3
  const den = dx1 * dy2 - dx2 * dy1
  const g = (dx3 * dy2 - dx2 * dy3) / den
  const k = (dx1 * dy3 - dx3 * dy1) / den
  const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3
  const d = y1 - y0 + g * y1, e = y3 - y0 + k * y3
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`
}

/** The tablet's screen and the card above it, sharing one chat feed. Mount it with
 *  `key={platform}`, so switching platform starts that platform's chat afresh. */
export function ListenOverlay({
  platform,
  playing,
  still,
  quad,
  cardAt,
  children,
}: {
  platform: Platform
  playing: boolean
  still: boolean
  quad: Pt[]
  cardAt: Pt
  /** Anything that must stay in front of the screen, e.g. the hand holding the tablet. */
  children?: ReactNode
}) {
  const { log, latest } = useChat(platform, playing)
  // With reduced motion nothing arrives, so the card shows the last message already there.
  const shown = latest ?? (still ? log[log.length - 1] : null)
  return (
    <>
      <TabletScreen quad={quad} platform={platform} log={log} />
      {children}
      <MessageCard platform={platform} latest={shown} at={cardAt} />
    </>
  )
}

/** Fills the character frame and lays the app onto the screen quad, given as fractions of the frame. */
function TabletScreen({ quad, platform, log }: { quad: Pt[]; platform: Platform; log: Msg[] }) {
  const box = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<string | null>(null)

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width) setTransform(quadTransform(DESIGN.w, DESIGN.h, quad.map(([x, y]) => [x * width, y * height])))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [quad])

  return (
    <div ref={box} aria-hidden className="pointer-events-none absolute inset-0">
      {transform && (
        <div
          className="absolute left-0 top-0 origin-top-left overflow-hidden rounded-[14px]"
          style={{ width: DESIGN.w, height: DESIGN.h, transform, backfaceVisibility: 'hidden' }}
        >
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            {platform === 'twitch' ? <TwitchApp log={log} /> : platform === 'youtube' ? <YouTubeApp log={log} /> : <TelegramApp log={log} />}
          </motion.div>
          {/* Glass: a soft diagonal sheen and a faint inner edge, so the app sits behind a screen. */}
          <div className="absolute inset-0 bg-[linear-gradient(118deg,rgb(255_255_255/0.10)_0%,rgb(255_255_255/0.03)_38%,transparent_39%,transparent_100%)]" />
          <div className="absolute inset-0 rounded-[14px] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.5),inset_0_0_18px_rgb(0_0_0/0.35)]" />
        </div>
      )}
    </div>
  )
}

/** Chat rows that slide up by one row as each message arrives. */
function Feed({ log, row, className, children }: { log: Msg[]; row: number; className?: string; children: (m: Msg, last: boolean) => ReactNode }) {
  const last = log[log.length - 1]
  return (
    <div className={cn('relative min-h-0 flex-1 overflow-hidden', className)}>
      <motion.div
        key={last?.id}
        className="absolute inset-x-0 bottom-0 flex flex-col"
        initial={{ y: row }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {log.map((m, i) => (
          <motion.div
            key={m.id}
            initial={i === log.length - 1 ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            {children(m, i === log.length - 1)}
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

// ── Twitch ───────────────────────────────────────────────────────────────────

export const TWITCH_GLYPH =
  'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z'
const TELEGRAM_GLYPH =
  'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'

const Glyph = ({ d, className, style }: { d: string; className?: string; style?: CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className} style={style}>
    <path d={d} />
  </svg>
)

function TwitchApp({ log }: { log: Msg[] }) {
  return (
    <div className="flex size-full flex-col bg-[#0e0e10] text-[#efeff1]">
      <div className="flex h-[42px] shrink-0 items-center gap-2.5 bg-[#18181b] px-3 shadow-[0_1px_0_rgb(0_0_0/0.6)]">
        <Glyph d={TWITCH_GLYPH} className="size-[22px] text-[#9146FF]" />
        <span className="text-[15px] font-bold">quackie</span>
        <span className="grid size-[13px] place-items-center rounded-full bg-[#9146FF] text-[9px] font-black text-white">✓</span>
        <span className="rounded-[4px] bg-[#EB0400] px-1.5 py-[2px] text-[11px] font-bold tracking-wide text-white">LIVE</span>
        <span className="text-[12px] text-[#adadb8]">4.8K watching</span>
        <span className="ml-auto rounded-[6px] bg-[#9146FF] px-3 py-[5px] text-[12px] font-bold text-white">♥ Follow</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex w-[318px] shrink-0 flex-col gap-2 p-2.5">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-[6px] bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/landing/listen/stream-twitch.webp)' }}
          >
            <span className="absolute left-2 top-2 rounded-[4px] bg-[#EB0400] px-1.5 py-[1px] text-[10px] font-bold text-white">LIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-[30px] shrink-0 rounded-full bg-[#FFC83D] ring-2 ring-[#9146FF]" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold">Just chatting with Quackie 🐥</div>
              <div className="flex gap-1.5 text-[11px]">
                <span className="text-[#bf94ff]">Just Chatting</span>
                <span className="rounded-full bg-[#2f2f35] px-1.5 text-[#dedee3]">vtuber</span>
                <span className="rounded-full bg-[#2f2f35] px-1.5 text-[#dedee3]">chill</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col border-l border-[#2f2f35] bg-[#18181b]">
          <div className="border-b border-[#2f2f35] py-2 text-center text-[11px] font-semibold tracking-[0.08em] text-[#adadb8]">STREAM CHAT</div>
          <Feed log={log} row={24} className="px-2.5 pb-1">
            {m => (
              <div className="truncate py-[3px] text-[14px] leading-[18px]">
                <span className="font-bold" style={{ color: m.color }}>{m.name}</span>
                <span className="text-[#efeff1]">: {m.text}</span>
              </div>
            )}
          </Feed>
          <div className="flex shrink-0 items-center gap-2 p-2">
            <span className="flex-1 rounded-[6px] bg-[#2f2f35] px-2 py-[6px] text-[11px] text-[#7a7a85]">Send a message</span>
            <span className="rounded-[6px] bg-[#9146FF] px-2.5 py-[5px] text-[11px] font-bold text-white">Chat</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── YouTube ──────────────────────────────────────────────────────────────────

const YouTubeLogo = ({ size = 18 }: { size?: number }) => (
  <span className="inline-flex items-center gap-1">
    <span className="relative grid place-items-center rounded-[5px] bg-[#FF0033]" style={{ width: size * 1.42, height: size }}>
      <span className="ml-[2px] border-y-[5px] border-l-[8px] border-y-transparent border-l-white" />
    </span>
    <span className="font-bold tracking-[-0.04em]" style={{ fontSize: size * 0.9 }}>
      YouTube
    </span>
  </span>
)

const initial = (name: string) => name.trim()[0]?.toUpperCase() ?? '?'

function YouTubeApp({ log }: { log: Msg[] }) {
  return (
    <div className="flex size-full flex-col bg-[#0f0f0f] text-[#f1f1f1]">
      <div className="flex h-[42px] shrink-0 items-center gap-3 px-3">
        <YouTubeLogo />
        <span className="ml-6 h-[24px] w-[190px] rounded-full border border-[#303030] bg-[#121212] px-3 text-[11px] leading-[22px] text-[#717171]">Search</span>
        <span className="ml-auto size-[22px] rounded-full bg-[#FFC83D]" />
      </div>
      <div className="flex min-h-0 flex-1 gap-2.5 px-2.5 pb-2.5">
        <div className="flex w-[318px] shrink-0 flex-col gap-2">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-[8px] bg-cover bg-center"
            style={{ backgroundImage: 'url(/images/landing/listen/stream-youtube.webp)' }}
          >
            <span className="absolute left-2 top-2 rounded-[3px] bg-[#CC0000] px-1.5 py-[1px] text-[10px] font-bold text-white">LIVE</span>
            <span className="absolute bottom-2 left-2 rounded-[3px] bg-black/70 px-1.5 py-[1px] text-[10px] text-white">12K watching</span>
          </div>
          <div className="truncate text-[14px] font-bold">chill stream with quackie 🐥</div>
          <div className="flex items-center gap-2">
            <span className="grid size-[26px] place-items-center rounded-full bg-[#FFC83D] text-[12px] font-black text-[#10131A]">Q</span>
            <div className="leading-tight">
              <div className="text-[12px] font-bold">Quackie</div>
              <div className="text-[10px] text-[#aaa]">241K subscribers</div>
            </div>
            <span className="ml-auto rounded-full bg-[#f1f1f1] px-3 py-[5px] text-[11px] font-bold text-[#0f0f0f]">Subscribe</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#303030]">
          <div className="flex items-center border-b border-[#303030] px-2.5 py-2 text-[12px]">
            Top chat <span className="ml-1 text-[#aaa]">▾</span>
          </div>
          <Feed log={log} row={26} className="px-2">
            {m =>
              m.tip ? (
                <div className="my-[3px] rounded-[6px] bg-[#FFCA28] px-2 py-[3px] text-[#10131A]">
                  <div className="text-[10px] font-bold">
                    {m.name} · {m.tip}
                  </div>
                  <div className="truncate text-[12px]">{m.text}</div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 py-[3px]">
                  <span
                    className="grid size-[18px] shrink-0 place-items-center rounded-full text-[9px] font-bold text-[#10131A]"
                    style={{ backgroundColor: m.color }}
                  >
                    {initial(m.name)}
                  </span>
                  <span className="truncate text-[13px] leading-[18px]">
                    <span className="text-[#aaa]">{m.name} </span>
                    {m.text}
                  </span>
                </div>
              )
            }
          </Feed>
          <div className="m-2 shrink-0 rounded-full bg-[#272727] px-2.5 py-[5px] text-[11px] text-[#aaa]">Chat…</div>
        </div>
      </div>
    </div>
  )
}

// ── Telegram ─────────────────────────────────────────────────────────────────

function TelegramApp({ log }: { log: Msg[] }) {
  return (
    <div className="flex size-full flex-col bg-[#0e1621] text-[#f5f5f5]">
      <div className="flex h-[48px] shrink-0 items-center gap-2.5 bg-[#17212b] px-3">
        <span className="text-[18px] text-[#6d7f8f]">‹</span>
        <span className="grid size-[32px] place-items-center rounded-full bg-[linear-gradient(135deg,#FFD66B,#FFC83D)] text-[15px] font-black text-[#10131A]">Q</span>
        <div className="leading-tight">
          <div className="text-[15px] font-bold">Quackie Fan Club</div>
          <div className="text-[11px] text-[#6d7f8f]">1,204 members, 87 online</div>
        </div>
        <Glyph d={TELEGRAM_GLYPH} className="ml-auto size-[20px] text-[#2AABEE]" />
      </div>
      <Feed
        log={log}
        row={50}
        className="bg-[radial-gradient(circle_at_center,rgb(255_255_255/0.035)_1px,transparent_1.5px)] bg-[length:14px_14px] px-3 pb-1"
      >
        {m => (
          <div className="flex items-end gap-2 py-[4px]">
            <span
              className="grid size-[26px] shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
              style={{ backgroundColor: m.color }}
            >
              {initial(m.name)}
            </span>
            <div className="max-w-[80%] rounded-[12px] rounded-bl-[4px] bg-[#182533] px-2.5 py-[4px]">
              <div className="text-[12px] font-bold leading-[16px]" style={{ color: m.color }}>
                {m.name}
              </div>
              <div className="flex items-end gap-2">
                <span className="truncate text-[14px] leading-[18px]">{m.text}</span>
                <span className="shrink-0 text-[10px] leading-[16px] text-[#6d7f8f]">21:1{m.id % 10}</span>
              </div>
            </div>
          </div>
        )}
      </Feed>
      <div className="flex h-[42px] shrink-0 items-center gap-3 bg-[#17212b] px-3 text-[#6d7f8f]">
        <span className="text-[16px]">📎</span>
        <span className="flex-1 text-[13px]">Message</span>
        <span className="grid size-[28px] place-items-center rounded-full bg-[#2AABEE] text-[13px] text-white">🎙</span>
      </div>
    </div>
  )
}

// ── The readable card above the tablet ───────────────────────────────────────

const CARD: Record<Platform, { label: string; glyph: ReactNode; className: string }> = {
  twitch: {
    label: 'Twitch chat',
    glyph: <Glyph d={TWITCH_GLYPH} className="size-[1.1em] text-[#9146FF]" />,
    className: 'bg-[#18181b] text-[#efeff1] ring-1 ring-[#9146FF]/40',
  },
  youtube: {
    label: 'YouTube live chat',
    glyph: <span className="inline-block h-[0.8em] w-[1.15em] rounded-[3px] bg-[#FF0033]" />,
    className: 'bg-[#0f0f0f] text-[#f1f1f1] ring-1 ring-white/15',
  },
  telegram: {
    label: 'Telegram group',
    glyph: <Glyph d={TELEGRAM_GLYPH} className="size-[1.1em] text-[#2AABEE]" />,
    className: 'bg-[#182533] text-[#f5f5f5] ring-1 ring-[#2AABEE]/40',
  },
}

/** The newest message, popped out above the tablet at a size people can read. `at` is where
 *  its tail points, as fractions of the character frame; the card hangs up and to the left of it. */
function MessageCard({ platform, latest, at }: { platform: Platform; latest: Msg | null; at: Pt }) {
  const card = CARD[platform]

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute w-[min(56vw,220px)] -translate-x-[80%] -translate-y-full lg:w-[calc(var(--u)*18)]"
      style={{ left: `${at[0] * 100}%`, top: `${at[1] * 100}%` }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {latest && (
          <motion.div
            key={latest.id}
            initial={{ opacity: 0, y: 14, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            transition={{ duration: 0.4, ease: EASE }}
            className={cn(
              'relative origin-bottom-right rounded-[12px] px-[0.85em] py-[0.6em] text-[13px] shadow-[-6px_5px_0_var(--q-bg)] lg:text-[calc(var(--u)*1.05)]',
              card.className,
            )}
          >
            <div className="mb-[0.3em] flex items-center gap-[0.4em] text-[0.78em] opacity-70">
              {card.glyph}
              {card.label}
              {latest.tip && <span className="ml-auto rounded-full bg-[#FFCA28] px-[0.5em] font-bold text-[#10131A]">{latest.tip}</span>}
            </div>
            <div className="leading-snug">
              <span className="font-bold" style={{ color: latest.color }}>
                {latest.name}
              </span>{' '}
              {latest.text}
            </div>
            {/* The tail points down at the tablet. */}
            <span className={cn('absolute -bottom-[7px] left-[calc(80%-7px)] size-[14px] rotate-45 rounded-[2px]', card.className, 'ring-0')} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
