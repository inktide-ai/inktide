'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

type TetrisShape = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z'

const SHAPE_PATHS: Record<TetrisShape, { d: string; viewBox: string }> = {
  I: { d: 'M0 0 H4 V1 H0 Z', viewBox: '0 0 4 1' },
  O: { d: 'M0 0 H2 V2 H0 Z', viewBox: '0 0 2 2' },
  T: { d: 'M0 0 H3 V1 H2 V2 H1 V1 H0 Z', viewBox: '0 0 3 2' },
  L: { d: 'M0 0 H1 V2 H3 V3 H0 Z', viewBox: '0 0 3 3' },
  J: { d: 'M2 0 H3 V3 H0 V2 H2 Z', viewBox: '0 0 3 3' },
  S: { d: 'M1 0 H3 V1 H2 V2 H0 V1 H1 Z', viewBox: '0 0 3 2' },
  Z: { d: 'M0 0 H2 V1 H3 V2 H1 V1 H0 Z', viewBox: '0 0 3 2' },
}

const ACCENT_COLORS = [
  'var(--accent-base)',
  'var(--stat-accent-warn)',
  'var(--stat-accent-info)',
  'var(--stat-accent-success)',
]

interface PieceConfig {
  shape: TetrisShape
  color: string
  size: number
  leftPct: number
  topPct: number
  rotation: number
  delay: number
  duration: number
}

const PIECES: PieceConfig[] = [
  { shape: 'L', color: ACCENT_COLORS[0], size: 110, leftPct: 8,  topPct: 14, rotation: -18, delay: 0.05, duration: 1.4 },
  { shape: 'T', color: ACCENT_COLORS[1], size: 90,  leftPct: 78, topPct: 10, rotation: 24,  delay: 0.25, duration: 1.5 },
  { shape: 'O', color: ACCENT_COLORS[2], size: 70,  leftPct: 18, topPct: 72, rotation: 12,  delay: 0.4,  duration: 1.6 },
  { shape: 'I', color: ACCENT_COLORS[3], size: 140, leftPct: 86, topPct: 68, rotation: -32, delay: 0.15, duration: 1.55 },
  { shape: 'S', color: ACCENT_COLORS[0], size: 95,  leftPct: 50, topPct: 82, rotation: 8,   delay: 0.55, duration: 1.4 },
  { shape: 'J', color: ACCENT_COLORS[1], size: 85,  leftPct: 4,  topPct: 44, rotation: 40,  delay: 0.7,  duration: 1.5 },
  { shape: 'Z', color: ACCENT_COLORS[2], size: 100, leftPct: 92, topPct: 38, rotation: -22, delay: 0.6,  duration: 1.45 },
]

function TetrisPiece({ shape, color, size }: { shape: TetrisShape; color: string; size: number }) {
  const { d, viewBox } = SHAPE_PATHS[shape]
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
    >
      <path d={d} fill={color} fillOpacity={0.9} />
    </svg>
  )
}

export function TetrisBackground() {
  const pieces = useMemo(() => PIECES, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p, idx) => (
        <motion.div
          key={idx}
          className="absolute"
          style={{
            left: `${p.leftPct}%`,
            top: `${p.topPct}%`,
            opacity: 0.18,
            filter: 'blur(0.5px)',
            willChange: 'transform, opacity',
          }}
          initial={{
            y: -600,
            x: -40 + Math.random() * 80,
            rotate: p.rotation - 180,
            opacity: 0,
          }}
          animate={{
            y: 0,
            x: 0,
            rotate: p.rotation,
            opacity: 0.2,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          <TetrisPiece shape={p.shape} color={p.color} size={p.size} />
        </motion.div>
      ))}
    </div>
  )
}
