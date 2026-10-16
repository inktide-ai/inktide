'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion'
import { Trans, useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { EASE, RevealLine, digits, display, ribbonStrip, useSceneFocus } from './broadcast'
import { parseMarkedWords, type Word } from './marked-words'

// Scene 02: memory. A viewer's message is squeezed down to the facts worth keeping and
// filed as a card in the vector store while chat carries on. A cut later ("7 days later")
// the same viewer writes again; the search finds the card, it comes back out, and
// Quackie picks the thread up again. It plays by itself, viewer after viewer.


/** A line of chat from someone else: nick, nick colour, text, and whether they wear a badge. */
type Chatter = [string, string, string, boolean?]

type Memory = {
  viewer: string
  /** What the rest of chat was saying just before. */
  chatter: Chatter[]
  /** Chat carrying on while the memory is filed. */
  after: Chatter[]
  /** The next stream's chat, before the viewer is back. */
  next: Chatter[]
  /** What the viewer writes when they're back; it sets the search off. */
  back: string
  /** Nick colour, the way chat clients give every viewer their own. */
  color: string
  words: Word[]
  facts: string[]
  vector: string
  /** The vault cell the card is filed under. */
  cell: number
  later: string
  stream: number
  reply: string
}

/** A chat line without its text: nick, nick colour, badge. The words come from landing.json. */
type ChatterMeta = [string, string, boolean?]

/** What the demo needs besides words; stage.remember.memories in landing.json holds the
 *  matching text, round for round, so chat reads in the visitor's language. */
type MemoryMeta = Pick<Memory, 'viewer' | 'color' | 'vector' | 'cell' | 'stream'> & {
  chatter: ChatterMeta[]
  after: ChatterMeta[]
  next: ChatterMeta[]
}

type MemoryText = Pick<Memory, 'back' | 'facts' | 'later' | 'reply'> & {
  chatter: string[]
  after: string[]
  next: string[]
  words: string
}

const MEMORIES: MemoryMeta[] = [
  {
    viewer: 'kot_enjoyer',
    chatter: [['mira_bakes', '#9BE38A', true], ['oleg_plays', '#FFC83D'], ['sasha', '#FFF8E7']],
    after: [['sasha', '#FFF8E7'], ['oleg_plays', '#FFC83D']],
    next: [['mira_bakes', '#9BE38A', true], ['dimon_tv', '#9BE38A']],
    color: '#7CC4FF',
    vector: '0.12 −0.84 0.33 0.07 −0.51 0.68',
    cell: 21,
    stream: 14,
  },
  {
    viewer: 'lena_draws',
    chatter: [['dimon_tv', '#9BE38A'], ['mira_bakes', '#9BE38A', true], ['oleg_plays', '#FFC83D']],
    after: [['kot_enjoyer', '#7CC4FF', true], ['sasha', '#FFF8E7']],
    next: [['oleg_plays', '#FFC83D'], ['mira_bakes', '#9BE38A', true]],
    color: '#FFC83D',
    vector: '−0.27 0.91 −0.05 0.44 0.18 −0.73',
    cell: 42,
    stream: 15,
  },
  {
    viewer: 'dimon_tv',
    chatter: [['sasha', '#FFF8E7'], ['kot_enjoyer', '#7CC4FF', true], ['lena_draws', '#FFC83D']],
    after: [['mira_bakes', '#9BE38A', true], ['lena_draws', '#FFC83D']],
    next: [['sasha', '#FFF8E7'], ['kot_enjoyer', '#7CC4FF', true]],
    color: '#9BE38A',
    vector: '0.58 0.02 −0.66 −0.31 0.24 0.95',
    cell: 7,
    stream: 16,
  },
]

const withText = (lines: ChatterMeta[], texts: string[]): Chatter[] =>
  lines.map(([nick, color, badge], i) => [nick, color, texts[i] ?? '', badge])

function useMemories(): Memory[] {
  const { t } = useTranslation('landing')
  return useMemo(() => {
    const texts = t('stage.remember.memories', { returnObjects: true }) as MemoryText[]
    return MEMORIES.map((meta, i) => {
      const text = texts[i]
      return {
        ...meta,
        ...text,
        chatter: withText(meta.chatter, text.chatter),
        after: withText(meta.after, text.after),
        next: withText(meta.next, text.next),
        words: parseMarkedWords(text.words),
      }
    })
  }, [t])
}

// One round of the demo, step by step, with how long each step holds (ms). Paced so
// each beat can be read before the next one lands.
const STEPS = [
  ['chat', 2600],
  ['compress', 1700],
  ['card', 2000],
  ['store', 1500],
  ['cut', 1700],
  ['back', 2100],
  ['recall', 1400],
  ['reply', 4800],
] as const

type Step = (typeof STEPS)[number][0]
const at = (step: Step) => STEPS.findIndex(([s]) => s === step)

// Quackie recalling (eyes shut, finger at the temple) and recognising the viewer. The
// second frame is the first with only the head swapped in, so the cut changes nothing
// but the face. Both are keyed 2560×1440 renders with room above the hood. The art faces
// right; the scene stands Quackie on the right, so it is flipped to look at the chat.
const ART = {
  thinking: '/images/landing/remember/recalling.png',
  recalled: '/images/landing/remember/recalled.png',
  mirror: true,
}

const VAULT = { cols: 16, rows: 4 }
// Other viewers' memories already in the store: a fixed scatter, keeping the demo's own cells free.
const FILED = new Set(
  Array.from({ length: VAULT.cols * VAULT.rows }, (_, i) => i).filter(i => (i * 37) % 11 < 5 && !MEMORIES.some(m => m.cell === i)),
)

const flat = { ...display, textShadow: 'none' }

// Inside the chat window there are two faces only: the UI sans for everything people
// type and every label, the display face for the few loud bits (the kept facts, the
// cut, Quackie's answer). This is the small label style.
const label = 'text-[11px] font-semibold uppercase tracking-[0.14em]'

export default function RememberScene() {
  const ref = useRef<HTMLElement>(null)
  const { entered } = useSceneFocus(ref)
  const reduceMotion = useReducedMotion() ?? false
  // With reduced motion the demo rests on its last step: the card and the reply.
  const [step, setStep] = useState(0)
  const [round, setRound] = useState(0)

  // The story plays while the chat window is in full view, and starts over from the
  // viewer's message each time it comes back into view, so nobody walks in on the ending.
  const demo = useRef<HTMLDivElement>(null)
  const [watching, setWatching] = useState(false)
  useEffect(() => {
    const el = demo.current
    if (!el) return
    let was = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        const on = entry.intersectionRatio >= 0.74
        if (on && !was) setStep(0)
        was = on
        setWatching(on)
      },
      { threshold: [0, 0.75] },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const running = watching && !reduceMotion

  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => {
      if (step < STEPS.length - 1) {
        setStep(step + 1)
      } else {
        setStep(0)
        setRound(r => r + 1)
      }
    }, STEPS[step][1])
    return () => window.clearTimeout(id)
  }, [running, step])

  const { t } = useTranslation('landing')
  const memories = useMemories()
  const now = reduceMotion ? at('reply') : step
  const memory = memories[round % memories.length]

  return (
    <section
      ref={ref}
      id="remember"
      data-chapter="02"
      aria-label={t('stage.remember.ariaLabel')}
      // Quackie's frame is 80 stage units wide and 16:9.
      style={
        {
          '--u': 'min(1vw, 1.7778svh)',
          '--frame-w': 'calc(var(--u) * 80)',
          '--frame-h': 'calc(var(--u) * 45)',
        } as CSSProperties
      }
      className={cn(
        // Clipped sideways only, so the ribbon can lie over the seam above.
        'relative isolate overflow-x-clip bg-[var(--q-bg)] pb-20 pt-28 text-[var(--q-cream)]',
        'lg:h-[100svh] lg:min-h-[720px] lg:snap-start lg:p-0',
      )}
    >
      <div aria-hidden style={ribbonStrip} className="absolute inset-x-0 top-0 z-20 h-[46px] -translate-y-1/2">
        <span
          style={digits}
          className="absolute right-[22%] top-1/2 grid h-[58px] w-[68px] -translate-y-1/2 place-items-center rounded-[10px] bg-[var(--q-duck)] text-[30px] text-[var(--q-bg)]"
        >
          02
        </span>
      </div>

      <div className="relative lg:h-full">
        {/* The cream screen the memory plays out on, and the yellow plate Quackie stands in
          on the right; both lean at the track's angle with a strip of dark ground between them.
          The plate starts a little below the top of Quackie's frame, so the hood pokes out over it. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[14%] -bottom-[10%] top-[calc(100%-var(--frame-h)*0.86)] -z-10 hidden w-[calc(14%+var(--u)*36)] -skew-x-[22.8deg] rounded-[44px] bg-[var(--q-duck)] lg:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-[14%] -bottom-[10%] top-[7%] -z-10 hidden w-[calc(14%+var(--u)*64)] -skew-x-[22.8deg] rounded-[44px] bg-[var(--q-cream)] lg:block"
        />

        <Character recalled={now >= at('recall')} />

        <div className="px-4 sm:px-[6.5vw] lg:absolute lg:left-[6.5vw] lg:top-[10%] lg:w-[calc(var(--u)*44)] lg:p-0 lg:text-[var(--q-bg)]">
          <div className="px-2 sm:px-0">
            {/* Dark type on the cream screen needs no offset shadow; cream type on phones does. */}
            <h2
              style={{ ...display, textShadow: 'var(--remember-shadow)' }}
              className="text-[clamp(52px,6.4vw,120px)] uppercase [--remember-shadow:-0.035em_0.03em_0_var(--q-bg)] lg:text-[calc(var(--u)*4.4)] lg:[--remember-shadow:none]"
            >
              <RevealLine delay={0.1} play={entered}>
                {t('stage.remember.title1')}
              </RevealLine>
              <RevealLine delay={0.2} play={entered}>
                <Trans
                  ns="landing"
                  t={t}
                  i18nKey="stage.remember.title2"
                  components={{ accent: <span className="text-[var(--q-duck)] lg:bg-[var(--q-duck)] lg:px-[0.08em] lg:text-[var(--q-bg)]" /> }}
                />
              </RevealLine>
            </h2>
            <p className="mt-4 max-w-[46ch] text-[clamp(15px,1.15vw,18px)] leading-relaxed text-[var(--q-cream-dim)] lg:text-[calc(var(--u)*1.1)] lg:text-[rgb(16_19_26/0.75)]">
              {t('stage.remember.body')}
            </p>
          </div>

          <div ref={demo} className="mt-[calc(var(--u)*2)]">
            <Demo memory={memory} round={round} now={now} />
          </div>
        </div>

        {/* Scene number on the dark ground above the plate, the way ZZZ labels its sections;
            it sits clear of the page's header. */}
        <div className="pointer-events-none absolute right-[6.5vw] top-[calc(5.5%_+_44px)] hidden items-end gap-[calc(var(--u)*1.2)] lg:flex">
          <div style={digits} className="origin-bottom-left -skew-x-[11deg] text-[calc(var(--u)*6)] text-[var(--q-duck)]">
            02
          </div>
          <div style={{ ...flat, fontStretch: '84%' }} className="pb-[calc(var(--u)*0.5)] text-[calc(var(--u)*2.6)] uppercase">
            {t('stage.nav.remember')}
          </div>
        </div>
      </div>
    </section>
  )
}

function Character({ recalled }: { recalled: boolean }) {
  return (
    <div className="pointer-events-none absolute bottom-0 right-[-5vw] hidden h-[var(--frame-h)] w-[var(--frame-w)] lg:block">
      {/* The hard offset shadow cuts the yellow hoodie out of the yellow plate; mirrored
          art flips its x, so the shadow is set the other way round to land on the left. */}
      <div
        className={cn(
          'absolute inset-0',
          ART.mirror ? '-scale-x-100 [filter:drop-shadow(10px_6px_0_var(--q-bg))]' : '[filter:drop-shadow(-10px_6px_0_var(--q-bg))]',
        )}
      >
        <Image src={ART.thinking} alt="" fill sizes="84vw" className="object-cover" />
        <Image
          src={ART.recalled}
          alt=""
          fill
          sizes="84vw"
          className={cn('object-cover transition-opacity duration-150', recalled ? 'opacity-100' : 'opacity-0')}
        />
      </div>
      {/* A yellow flash covers the change of face. */}
      <AnimatePresence>
        {recalled && (
          <motion.div
            key="flash"
            className={cn(
              'absolute inset-0',
              ART.mirror
                ? 'bg-[radial-gradient(40%_50%_at_70%_45%,rgb(255_200_61/0.75),transparent_70%)]'
                : 'bg-[radial-gradient(40%_50%_at_30%_45%,rgb(255_200_61/0.75),transparent_70%)]',
            )}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function Demo({ memory, round, now }: { memory: Memory; round: number; now: number }) {
  const { t } = useTranslation('landing')
  const step = STEPS[now][0]
  const cardOut = step === 'card' || now >= at('recall')
  const found = now >= at('recall')
  // Chat never stops: before the message, while it is filed, and on the next stream.
  const feed =
    now <= at('compress')
      ? { id: 'before', lines: memory.chatter }
      : step === 'store' || step === 'cut'
        ? { id: 'after', lines: memory.after }
        : step === 'back'
          ? { id: 'next', lines: memory.next }
          : null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[22px] bg-[var(--q-bg)] p-4 text-[var(--q-cream)] ring-1 ring-[rgb(255_248_231/0.12)] sm:p-5',
        'lg:p-[calc(var(--u)*1.5)] lg:shadow-[-12px_10px_0_0_#0B0D12]',
      )}
    >
      <div className={cn(label, 'text-[var(--q-cream-dim)]')}>{t('stage.remember.streamChat')}</div>

      <LayoutGroup id="remember">
        {/* The stage: chat, the card the message turns into, and the reply. */}
        <div className="relative mt-4 h-[300px] sm:h-[280px] lg:h-[calc(var(--u)*12+80px)]">
          <AnimatePresence>
            {feed && (
              <motion.div
                key={`${feed.id}-${round}`}
                className="absolute inset-0 flex flex-col justify-end gap-[calc(var(--u)*0.55)]"
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
              >
                {feed.lines.map((line, i) => (
                  <ChatterLine key={line[0] + line[2]} line={line} index={i} dim={step === 'compress'} />
                ))}
                {feed.id === 'before' && <ChatLine memory={memory} compressing={step === 'compress'} />}
                {feed.id === 'next' && <Returning memory={memory} arriving />}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 top-0 flex flex-col gap-[calc(var(--u)*0.9)]">
            {found && <Returning memory={memory} />}
            {cardOut && <Card memory={memory} />}
            <AnimatePresence>{step === 'reply' && <Reply key={`reply-${round}`} text={memory.reply} />}</AnimatePresence>
          </div>
        </div>

        <Vault memory={memory} round={round} now={now} />
      </LayoutGroup>

      <Stinger run={step === 'cut' ? round : null} memory={memory} />
    </div>
  )
}

/** Someone else's line in chat, small, with a badge in the scene's own shape rather than a platform's. */
function ChatterLine({ line: [nick, color, text, badge], index, dim }: { line: Chatter; index: number; dim: boolean }) {
  return (
    <motion.p
      className="flex items-center gap-2 px-4 text-[14px] leading-snug text-[rgb(255_248_231/0.78)] lg:text-[calc(var(--u)*1.05)]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: dim ? 0.25 : 1, y: 0 }}
      transition={{ duration: 0.45, delay: dim ? 0 : index * 0.32, ease: EASE }}
    >
      {badge && <span aria-hidden className="size-[0.8em] shrink-0 -skew-x-12 rounded-[2px] bg-[var(--q-duck)]" />}
      <span className="truncate">
        <span className="font-semibold" style={{ color }}>
          {nick}
        </span>
        : {text}
      </span>
    </motion.p>
  )
}

/** The viewer's message on their next visit. It lands in chat, sets the search off, then
 *  moves up to head the recalled card. */
function Returning({ memory, arriving = false }: { memory: Memory; arriving?: boolean }) {
  return (
    <motion.div
      layoutId="returning"
      className="relative overflow-hidden rounded-xl bg-[rgb(255_248_231/0.07)] py-2 pl-4 pr-3 text-[14px] leading-snug ring-1 ring-[rgb(255_248_231/0.1)] lg:text-[calc(var(--u)*1.05)]"
      initial={arriving ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: arriving ? 0.75 : 0, ease: EASE }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-[var(--q-duck)]" />
      <span className="font-semibold" style={{ color: memory.color }}>
        {memory.viewer}
      </span>
      : {memory.back}
    </motion.div>
  )
}

function ChatLine({ memory, compressing }: { memory: Memory; compressing: boolean }) {
  return (
    <motion.div
      layoutId="memory"
      // The viewer's line lands last, marked like a highlighted message in chat.
      className="relative overflow-hidden rounded-2xl bg-[rgb(255_248_231/0.07)] p-4 pl-5 ring-1 ring-[rgb(255_248_231/0.1)]"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-[var(--q-duck)]" />
      <span className="text-[14px] font-semibold" style={{ color: memory.color }}>
        {memory.viewer}
      </span>
      <p className="mt-1.5 flex flex-wrap gap-x-[0.3em] text-[clamp(19px,1.75vw,28px)] font-semibold leading-snug lg:text-[calc(var(--u)*1.75)]">
        {memory.words.map((word, i) => (
          <motion.span
            key={i}
            className={cn('rounded-md transition-colors duration-300', word.key && compressing && 'bg-[var(--q-duck)] px-1.5 text-[var(--q-bg)]')}
            animate={!word.key && compressing ? { opacity: 0.12, filter: 'blur(5px)' } : { opacity: 1, filter: 'blur(0px)' }}
            transition={{
              duration: 0.5,
              delay: compressing ? (i % 4) * 0.05 : 0,
            }}
          >
            {word.text}
          </motion.span>
        ))}
      </p>
    </motion.div>
  )
}

function Card({ memory }: { memory: Memory }) {
  const { t } = useTranslation('landing')
  return (
    <motion.div layoutId="memory" className="rounded-2xl bg-[var(--q-cream)] p-4 text-[var(--q-bg)]" transition={{ duration: 0.9, ease: EASE }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35, delay: 0.5 }}>
        <div className={cn(label, 'flex items-center justify-between text-[rgb(16_19_26/0.55)]')}>
          <span>{t('stage.remember.memory')}</span>
          <span className="normal-case tracking-normal text-[var(--q-bg)]">{memory.viewer}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {memory.facts.map(fact => (
            <span
              key={fact}
              style={flat}
              className="-skew-x-6 rounded-md bg-[var(--q-duck)] px-2.5 py-1 text-[clamp(15px,1.3vw,20px)] uppercase lg:text-[calc(var(--u)*1.3)]"
            >
              {fact}
            </span>
          ))}
        </div>
        <p className="mt-2.5 truncate text-[12px] tabular-nums text-[rgb(16_19_26/0.5)]">[{memory.vector} …]</p>
      </motion.div>
    </motion.div>
  )
}

/** The vector store: a grid of filed memories, with the demo's card landing in its cell.
 *  When the viewer is back, the cell pulses as the search finds it. */
function Vault({ memory, round, now }: { memory: Memory; round: number; now: number }) {
  const { t } = useTranslation('landing')
  const index = round % MEMORIES.length
  const step = STEPS[now][0]
  const inVault = now >= at('store') && now < at('recall')
  // The viewer's message lands about 0.8 s into their return; the search fires then.
  const calling = step === 'back'
  const found = now >= at('recall')

  return (
    <div className="mt-3">
      <div className={cn(label, 'mb-2 flex justify-between text-[rgb(255_248_231/0.4)]')}>
        <span>{t('stage.remember.vectorDb')}</span>
        {found ? (
          <span className="text-[var(--q-duck)]">
            {t('stage.remember.match')} · <span className="normal-case tracking-normal">{memory.viewer}</span>
          </span>
        ) : (
          <span>
            {calling ? (
              <>
                {t('stage.remember.search')} · <span className="normal-case tracking-normal">{memory.viewer}</span>
              </>
            ) : (
              t('stage.remember.compressed')
            )}
          </span>
        )}
      </div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${VAULT.cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: VAULT.cols * VAULT.rows }, (_, i) => {
          const demo = MEMORIES.findIndex(m => m.cell === i)
          // Earlier rounds of this cycle have already filed their cards.
          const stored = FILED.has(i) || (demo >= 0 && (demo < index || (demo === index && now >= at('store'))))
          const current = demo === index
          const base = cn(
            'block h-[9px] rounded-[2px] sm:h-[10px] lg:h-[calc(var(--u)*0.7)]',
            stored ? 'bg-[rgb(255_248_231/0.2)]' : 'ring-1 ring-inset ring-[rgb(255_248_231/0.08)]',
            current && stored && 'bg-[var(--q-duck)] shadow-[0_0_12px_rgb(255_200_61/0.7)]',
          )
          return current && inVault ? (
            <motion.span
              key={i}
              layoutId="memory"
              className={cn(base, 'bg-[var(--q-duck)]')}
              animate={calling ? { scale: [1, 1.8, 1] } : { scale: 1 }}
              transition={calling ? { duration: 0.7, delay: 1.3, repeat: 1 } : { duration: 0.9, ease: EASE }}
            />
          ) : (
            <span key={i} className={base} />
          )
        })}
      </div>
    </div>
  )
}

/** Quackie's answer: typed out while a little voice meter bounces. */
function Reply({ text }: { text: string }) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setShown(n => Math.min(n + 1, text.length)), 26)
    return () => window.clearInterval(id)
  }, [text])

  const talking = shown < text.length

  return (
    <motion.div
      className="flex items-start gap-3 rounded-2xl bg-[var(--q-duck)] p-3.5 text-[var(--q-bg)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <span style={flat} className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--q-bg)] text-[20px] text-[var(--q-duck)]">
        Q
      </span>
      <div className="min-w-0">
        <div className={cn(label, 'flex items-center gap-2')}>
          Quackie
          <span aria-hidden className="flex h-3 items-center gap-[2px]">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.span
                key={i}
                className="block h-full w-[3px] origin-center rounded-full bg-[var(--q-bg)]"
                animate={talking ? { scaleY: [0.3, 1, 0.45, 0.85, 0.3] } : { scaleY: 0.3 }}
                transition={talking ? { duration: 0.7, repeat: Infinity, delay: i * 0.09 } : { duration: 0.2 }}
              />
            ))}
          </span>
        </div>
        {/* The untyped rest keeps its space, so the strip never grows while typing. */}
        <p style={flat} className="mt-1.5 text-[clamp(17px,1.45vw,22px)] uppercase leading-[1.02] lg:text-[calc(var(--u)*1.45)]">
          {text.slice(0, shown)}
          <span className="opacity-0">{text.slice(shown)}</span>
        </p>
      </div>
    </motion.div>
  )
}

/** The jump cut between streams: a yellow bar sweeps over the demo with how much later it is. */
function Stinger({ run, memory }: { run: number | null; memory: Memory }) {
  const { t } = useTranslation('landing')
  return (
    <AnimatePresence>
      {run !== null && (
        <motion.div
          key={run}
          aria-hidden
          className="absolute inset-y-[-10%] left-[-10%] z-10 flex w-[120%] -skew-x-12 items-center justify-center gap-6 bg-[var(--q-duck)] text-[var(--q-bg)]"
          initial={{ x: '100%' }}
          animate={{ x: ['100%', '0%', '0%', '-100%'] }}
          transition={{
            duration: 1.5,
            times: [0, 0.22, 0.78, 1],
            ease: [EASE, 'linear', [0.65, 0, 0.35, 1]],
          }}
        >
          <span style={flat} className="skew-x-12 text-[clamp(30px,3.4vw,56px)] uppercase lg:text-[calc(var(--u)*3.4)]">
            {memory.later}
          </span>
          <span style={flat} className="skew-x-12 text-[clamp(18px,1.6vw,26px)] uppercase lg:text-[calc(var(--u)*1.6)]">
            {t('stage.remember.stream', { number: memory.stream })}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
