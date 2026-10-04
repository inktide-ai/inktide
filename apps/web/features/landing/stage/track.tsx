'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { digits } from './broadcast'

// The background the whole landing scrolls over, like the track on the ZZZ site:
// a few huge slanted slabs that run across section boundaries, and a timeline
// ribbon (a scrubber with chapter marks) threading between them. It is measured
// against the live sections and drawn in page pixels, so slabs meet the content
// exactly at any viewport and every slanted edge keeps one angle.

/** Run per unit of rise on every slanted edge — the angle of the hero's panel. */
export const SLOPE = 0.42

/** Where a showcase scene's slabs sit, as fractions of its width and height.
 *  The scene lays its character out against the same numbers. */
export const CUSTOMIZE_GEOMETRY = {
  screenTop: 0.13,
  screenLeft: 0.5,
  plateTop: 0.66,
  plateRight: 0.28,
}

const RADIUS = 44
const RIBBON = 46
const OFF = 140 // how far slabs run past the page edges, so their ends never show

type Pt = [number, number]
type Box = { top: number; height: number; chapter: string }
type Chip = { at: Pt; label: string }

type SceneShapes = {
  road: string
  plate: string
  screen: string
  ribbon: string
  /** The band the ribbon may show in: from just above the seam to the top edge of the
   *  next section's own ribbon strip, which it runs into. */
  ribbonTop: number
  ribbonEnd: number
  chip: Chip
}

type Shapes = { width: number; height: number; scenes: SceneShapes[] }

/** A closed polygon with every corner rounded. */
function roundedPath(points: Pt[], radius: number) {
  const n = points.length
  const parts = points.map((p, i) => {
    const prev = points[(i + n - 1) % n]
    const next = points[(i + 1) % n]
    const toPrev = [prev[0] - p[0], prev[1] - p[1]]
    const toNext = [next[0] - p[0], next[1] - p[1]]
    const lp = Math.hypot(toPrev[0], toPrev[1])
    const ln = Math.hypot(toNext[0], toNext[1])
    const r = Math.min(radius, lp / 2, ln / 2)
    const a: Pt = [p[0] + (toPrev[0] / lp) * r, p[1] + (toPrev[1] / lp) * r]
    const b: Pt = [p[0] + (toNext[0] / ln) * r, p[1] + (toNext[1] / ln) * r]
    return { a, p, b }
  })
  const f = (q: Pt) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`
  return `M${f(parts[0].a)} ${parts.map(({ a, p, b }, i) => `${i ? `L${f(a)} ` : ''}Q${f(p)} ${f(b)}`).join(' ')} Z`
}

/** An open polyline with its bends rounded. */
function bentPath(points: Pt[], radius: number) {
  const f = (q: Pt) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`
  let d = `M${f(points[0])}`
  for (let i = 1; i < points.length - 1; i++) {
    const [p, prev, next] = [points[i], points[i - 1], points[i + 1]]
    const lp = Math.hypot(prev[0] - p[0], prev[1] - p[1])
    const ln = Math.hypot(next[0] - p[0], next[1] - p[1])
    const r = Math.min(radius, lp / 2, ln / 2)
    const a: Pt = [p[0] + ((prev[0] - p[0]) / lp) * r, p[1] + ((prev[1] - p[1]) / lp) * r]
    const b: Pt = [p[0] + ((next[0] - p[0]) / ln) * r, p[1] + ((next[1] - p[1]) / ln) * r]
    d += ` L${f(a)} Q${f(p)} ${f(b)}`
  }
  return `${d} L${f(points[points.length - 1])}`
}

/** x of a slanted edge through (x0, y0), at height y. */
const edge = (x0: number, y0: number) => (y: number) => x0 - SLOPE * (y - y0)

/** The cream screen Quackie stands in on a showcase scene, open to the right and
 *  below, with its leaning left edge and rounded corners. `top` and `height` are the
 *  scene's box; the track draws it in page pixels, the scene clips to it in its own. */
export function customizeScreenPath(width: number, height: number, top = 0) {
  const screenTop = top + CUSTOMIZE_GEOMETRY.screenTop * height
  const screenEdge = edge(CUSTOMIZE_GEOMETRY.screenLeft * width, screenTop)
  const bottom = top + height + OFF
  return roundedPath(
    [
      [screenEdge(screenTop), screenTop],
      [width + OFF, screenTop],
      [width + OFF, bottom],
      [screenEdge(bottom), bottom],
    ],
    RADIUS,
  )
}

function sceneLayout(width: number, scene: Box, copyBottom: number | null): SceneShapes {
  const g = CUSTOMIZE_GEOMETRY
  const top = scene.top
  const h = scene.height
  const bottom = top + h + OFF

  // The road: a hatched slab under the copy, from the seam down to the plate.
  const roadEdge = edge(0.47 * width, top)

  const screenTop = top + g.screenTop * h

  // The yellow plate that carries the scene's number, kept clear of the copy above it.
  const plateTop = Math.max(top + g.plateTop * h, (copyBottom ?? 0) + 0.04 * h)
  const plateEdge = edge(g.plateRight * width, plateTop)
  const roadBottom = plateTop - 0.03 * h

  // The ribbon lies along the seam above the scene, over the bottom edge of the one before,
  // then dives down the gap between the plate and the screen, parallel to both.
  const ribbonY = top
  const mid = (screenTop + plateTop) / 2
  const ribbonEdge = edge(((g.screenLeft + g.plateRight) / 2) * width, mid)

  return {
    road: roundedPath(
      [
        [-OFF, top],
        [roadEdge(top), top],
        [roadEdge(roadBottom), roadBottom],
        [-OFF, roadBottom],
      ],
      RADIUS,
    ),
    screen: customizeScreenPath(width, h, top),
    plate: roundedPath(
      [
        [-OFF, plateTop],
        [plateEdge(plateTop), plateTop],
        [plateEdge(bottom), bottom],
        [-OFF, bottom],
      ],
      RADIUS,
    ),
    ribbon: bentPath(
      [
        [width + OFF, ribbonY],
        [ribbonEdge(ribbonY), ribbonY],
        [ribbonEdge(bottom), bottom],
      ],
      70,
    ),
    ribbonTop: top - RIBBON,
    ribbonEnd: top + h - RIBBON / 2,
    chip: { at: [width * 0.78, ribbonY], label: scene.chapter },
  }
}

/** Fills its positioned parent and measures the showcase scenes inside it (`data-track-scene`),
 *  which the slabs are drawn around. */
export default function Track() {
  const ref = useRef<HTMLDivElement>(null)
  const [shapes, setShapes] = useState<Shapes | null>(null)

  useLayoutEffect(() => {
    const root = ref.current?.parentElement
    if (!root) return
    const scenes = () => [...root.querySelectorAll<HTMLElement>('[data-track-scene]')]
    const measure = () => {
      const rootTop = root.getBoundingClientRect().top
      setShapes({
        width: root.offsetWidth,
        height: root.offsetHeight,
        scenes: scenes().map(scene => {
          const copy = scene.querySelector<HTMLElement>('[data-track-anchor]')
          const copyBottom = copy ? copy.getBoundingClientRect().bottom - rootTop : null
          return sceneLayout(
            root.offsetWidth,
            { top: scene.offsetTop, height: scene.offsetHeight, chapter: scene.dataset.chapter ?? '' },
            copyBottom,
          )
        }),
      })
    }
    measure()
    // The copy columns can grow without the page changing size (fonts, wrapping).
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    scenes().forEach(scene => {
      const copy = scene.querySelector('[data-track-anchor]')
      if (copy) observer.observe(copy)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
      {shapes && <TrackShapes shapes={shapes} />}
    </div>
  )
}

function TrackShapes({ shapes }: { shapes: Shapes }) {
  const { width, height } = shapes
  const box = { width, height, viewBox: `0 0 ${width} ${height}` }
  return (
    <>
      <svg {...box} className="absolute left-0 top-0">
        <defs>
          {/* Fine diagonal pinstripes keep the dark slabs from reading as flat black. */}
          <pattern id="track-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-48)">
            <rect width="9" height="9" fill="#171B26" />
            <rect width="3" height="9" fill="#212734" />
          </pattern>
        </defs>

        {shapes.scenes.map((s, i) => (
          <g key={i}>
            <path d={s.road} fill="url(#track-hatch)" />
            <path d={s.plate} fill="var(--q-duck)" />
            <path d={s.screen} fill="var(--q-cream)" />
          </g>
        ))}
      </svg>

      {/* Timeline ribbon: a cream scrubber with ruler ticks, every fifth one long. It sits
          over the scenes so it can cover the seam where the hero's art is cut off. */}
      <svg {...box} className="absolute left-0 top-0 z-30">
        {shapes.scenes.map((s, i) => (
          <g key={i}>
            <defs>
              <clipPath id={`track-ribbon-clip-${i}`}>
                <rect y={s.ribbonTop} width={width} height={s.ribbonEnd - s.ribbonTop} />
              </clipPath>
            </defs>
            <g clipPath={`url(#track-ribbon-clip-${i})`}>
              <path d={s.ribbon} fill="none" stroke="var(--q-cream)" strokeWidth={RIBBON} strokeLinejoin="round" />
              <path d={s.ribbon} fill="none" stroke="var(--q-bg)" strokeWidth={14} strokeDasharray="4 18" />
              <path d={s.ribbon} fill="none" stroke="var(--q-bg)" strokeWidth={28} strokeDasharray="4 106" />
            </g>
            <g transform={`translate(${s.chip.at[0]} ${s.chip.at[1]})`}>
              <rect x={-34} y={-RIBBON / 2 - 6} width={68} height={RIBBON + 12} rx={10} fill="var(--q-duck)" />
              <text textAnchor="middle" dominantBaseline="central" style={{ ...digits, fontSize: 30 }} fill="var(--q-bg)">
                {s.chip.label}
              </text>
            </g>
          </g>
        ))}
      </svg>
    </>
  )
}
