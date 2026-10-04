'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentType } from 'react'
import { motion, useAnimate } from 'framer-motion'
import ChatScene from './chat-scene'
import StartingSoonScene from './starting-soon-scene'
import { CHAT_BAND, EASE, STARTING_SOON_BAND, SceneContext, type Band, type SceneState } from './broadcast'

// On desktop the landing runs like a stream switching scenes in OBS: one wheel
// notch, swipe or arrow key cuts to the next scene. On the cut the yellow band
// flies out of the old layout, under the characters, the camera kicks, and it
// lands exactly where the new scene draws its own — one object carried through
// the whole site.
// Phones keep ordinary scrolling.

const SCENES: { band: Band; Scene: ComponentType }[] = [
  { band: STARTING_SOON_BAND, Scene: StartingSoonScene },
  { band: CHAT_BAND, Scene: ChatScene },
]

// Timeline of a cut, in seconds: the old scene whips out, the new one swaps in
// at CUT_AT under the band, and the band settles into place by BAND_FLIGHT.
const WHIP_OUT = 0.34
const CUT_AT = 0.3
const SETTLE_IN = 0.55
const BAND_FLIGHT = CUT_AT + SETTLE_IN

const DESKTOP = '(min-width: 1024px)'

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const isDesktop = () => window.matchMedia(DESKTOP).matches

const wait = (seconds: number) => new Promise(resolve => window.setTimeout(resolve, seconds * 1000))

type Point = [number, number]

const toPath = (points: Point[]) => `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')} Z`

/** A scene's band in viewport pixels, using the same box maths as the scene's own stage. */
function bandPath({ anchor, points }: Band, vw: number, vh: number) {
  const w = Math.max(vw, (vh * 16) / 9)
  const h = (w * 9) / 16
  const x0 = anchor === 'right' ? vw - w : (vw - w) / 2
  const y0 = anchor === 'right' ? 0 : (vh - h) / 2
  const k = w / 1280
  return toPath(points.map(([x, y]): Point => [x0 + x * k, y0 + y * k]))
}

/** Mid-flight: a fat diagonal through the middle of the screen, covering the swap. */
const impactPath = (vw: number, vh: number) =>
  toPath([
    [vw * 0.28, -vh * 0.05],
    [vw * 0.82, -vh * 0.05],
    [vw * 0.64, vh * 1.05],
    [vw * 0.1, vh * 1.05],
  ])

type Cut = { from: number; to: number; id: number; vw: number; vh: number; band: string[] }

export default function SceneDeck() {
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => false)
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const [index, setIndex] = useState(0)
  const [cut, setCut] = useState<Cut | null>(null)
  const [visited, setVisited] = useState<number[]>([0])
  // Handlers read these; render reads the state above.
  const current = useRef(0)
  const busy = useRef(false)

  const goTo = useCallback(
    async (to: number) => {
      const from = current.current
      if (busy.current || to === from || to < 0 || to >= SCENES.length || !scope.current) return
      busy.current = true
      current.current = to
      setVisited(v => (v.includes(to) ? v : [...v, to]))

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIndex(to)
        busy.current = false
        return
      }

      const dir = to > from ? 1 : -1
      const { width: vw, height: vh } = scope.current.getBoundingClientRect()
      // The arriving scene is unhidden as the cut starts; keep it transparent
      // until the swap so the leaving scene stays on screen.
      animate(`[data-scene="${to}"]`, { opacity: 0 }, { duration: 0 })
      setCut({
        from,
        to,
        id: Date.now(),
        vw,
        vh,
        band: [bandPath(SCENES[from].band, vw, vh), impactPath(vw, vh), bandPath(SCENES[to].band, vw, vh)],
      })

      // Whip the old scene out along the scroll direction, smearing as it goes.
      animate(
        `[data-scene="${from}"]`,
        { opacity: 0, y: `${-dir * 5}%`, scale: 1.02, filter: 'blur(8px)' },
        { duration: WHIP_OUT, ease: [0.7, 0, 0.84, 0] },
      )
      await wait(CUT_AT)
      setIndex(to)

      // The camera kick lands with the cut: a short decaying shake, slightly
      // zoomed so the frame edges never show.
      animate(
        '[data-shake]',
        {
          x: [0, -11, 9, -6, 3, -1, 0],
          y: [0, 7, -5, 3, -2, 0, 0],
          rotate: [0, -0.5, 0.35, -0.2, 0.08, 0, 0],
          scale: [1.03, 1.03, 1.03, 1.02, 1.01, 1, 1],
        },
        { duration: 0.34, ease: 'easeOut' },
      )
      animate(
        `[data-scene="${to}"]`,
        { opacity: [0, 1], y: [`${dir * 6}%`, '0%'], scale: [1.02, 1], filter: ['blur(8px)', 'blur(0px)'] },
        { duration: SETTLE_IN, ease: EASE },
      )
      // Hand the band back to the scene on the clock rather than on the animation's
      // promise, so an interrupted animation can never leave the band hanging.
      await wait(SETTLE_IN)

      setCut(null)
      busy.current = false
    },
    [animate, scope],
  )

  useEffect(() => {
    if (!desktop) return

    // One gesture, one cut. Trackpads keep firing inertial wheel events for a
    // second or more, so a new cut needs a pause in the stream first.
    let lastWheel = 0
    let armed = true
    const onWheel = (e: WheelEvent) => {
      const now = performance.now()
      if (now - lastWheel > 220) armed = true
      lastWheel = now
      if (!armed || busy.current || Math.abs(e.deltaY) < 8) return
      armed = false
      goTo(current.current + (e.deltaY > 0 ? 1 : -1))
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')) return
      const step = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[e.key]
      if (step) {
        e.preventDefault()
        goTo(current.current + step)
      } else if (e.key === 'Home') goTo(0)
      else if (e.key === 'End') goTo(SCENES.length - 1)
    }

    let touchY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      const dy = touchY - e.changedTouches[0].clientY
      if (Math.abs(dy) > 50) goTo(current.current + (dy > 0 ? 1 : -1))
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [desktop, goTo])

  const states = useMemo(
    () =>
      SCENES.map(
        (_, i): SceneState => ({
          active: i === index,
          settled: i === index && cut === null,
          entered: visited.includes(i),
          count: SCENES.length,
          goTo,
        }),
      ),
    [index, cut, visited, goTo],
  )

  return (
    <div ref={scope} className="relative bg-[#10131A] lg:h-[100svh] lg:overflow-hidden">
      <div data-shake className="lg:absolute lg:inset-0">
        {/* The flying band sits on the ground, under every scene, exactly where each
            scene's own band sits under its character — so it never covers anyone. */}
        {cut && (
          <svg
            aria-hidden
            viewBox={`0 0 ${cut.vw} ${cut.vh}`}
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 size-full"
          >
            <motion.path
              key={cut.id}
              className="fill-[#FFC83D]"
              initial={{ d: cut.band[0] }}
              animate={{ d: cut.band }}
              transition={{ duration: BAND_FLIGHT, times: [0, 0.36, 1], ease: [[0.7, 0, 0.84, 0], EASE] }}
            />
          </svg>
        )}

        {SCENES.map(({ Scene }, i) => {
          const shown = i === index || (cut !== null && (i === cut.from || i === cut.to))
          return (
            // Scenes stack in one frame on desktop and stay mounted, so the
            // starting-soon clock and the chat carousel keep their place.
            <div key={i} data-scene={i} data-shown={shown} className="lg:absolute lg:inset-0 lg:data-[shown=false]:invisible">
              <SceneContext.Provider value={desktop ? states[i] : null}>
                <Scene />
              </SceneContext.Provider>
            </div>
          )
        })}
      </div>
    </div>
  )
}
