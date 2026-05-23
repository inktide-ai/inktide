'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

type TetrisShape = 'I' | 'O' | 'T' | 'L' | 'J' | 'S' | 'Z'

const SHAPE_PATHS: Record<TetrisShape, { d: string; viewBox: string }> = {
  I: { d: 'M0 0 H4 V1 H0 Z',             viewBox: '0 0 4 1' },
  O: { d: 'M0 0 H2 V2 H0 Z',             viewBox: '0 0 2 2' },
  T: { d: 'M0 0 H3 V1 H2 V2 H1 V1 H0 Z', viewBox: '0 0 3 2' },
  L: { d: 'M0 0 H1 V2 H3 V3 H0 Z',       viewBox: '0 0 3 3' },
  J: { d: 'M2 0 H3 V3 H0 V2 H2 Z',       viewBox: '0 0 3 3' },
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
  /** Final resting position */
  leftPct: number
  topPct: number
  rotation: number
  /** Direction the piece flies in from: how far it starts offset */
  fromX: number
  fromY: number
  delay: number
}

const PIECES: PieceConfig[] = [
  { shape: 'L', color: ACCENT_COLORS[0], size: 160, leftPct: 4,  topPct: 8,  rotation: -15, fromX: -220, fromY: -80,  delay: 0.00 },
  { shape: 'T', color: ACCENT_COLORS[1], size: 130, leftPct: 72, topPct: 6,  rotation: 20,  fromX:  200, fromY: -100, delay: 0.04 },
  { shape: 'S', color: ACCENT_COLORS[2], size: 140, leftPct: 82, topPct: 42, rotation: -10, fromX:  240, fromY:  60,  delay: 0.08 },
  { shape: 'J', color: ACCENT_COLORS[3], size: 150, leftPct: 6,  topPct: 54, rotation: 28,  fromX: -200, fromY:  80,  delay: 0.12 },
  { shape: 'O', color: ACCENT_COLORS[0], size: 110, leftPct: 44, topPct: 78, rotation: 0,   fromX:  0,   fromY:  180, delay: 0.16 },
  { shape: 'Z', color: ACCENT_COLORS[1], size: 120, leftPct: 14, topPct: 30, rotation: -22, fromX: -160, fromY: -40,  delay: 0.05 },
  { shape: 'I', color: ACCENT_COLORS[2], size: 180, leftPct: 58, topPct: 66, rotation: 35,  fromX:  100, fromY:  200, delay: 0.10 },
  { shape: 'T', color: ACCENT_COLORS[3], size: 125, leftPct: 30, topPct: 12, rotation: -30, fromX: -50,  fromY: -180, delay: 0.02 },
  { shape: 'L', color: ACCENT_COLORS[0], size: 115, leftPct: 88, topPct: 74, rotation: 18,  fromX:  220, fromY:  160, delay: 0.14 },
]

function TetrisPiece({ shape, color, size }: { shape: TetrisShape; color: string; size: number }) {
  const { d, viewBox } = SHAPE_PATHS[shape]
  return (
    <svg width={size} height={size} viewBox={viewBox} preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden>
      <path d={d} fill={color} fillOpacity={0.88} />
    </svg>
  )
}

export function TetrisAssemble() {
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
            filter: 'blur(0.4px)',
            willChange: 'transform, opacity',
          }}
          initial={{ x: p.fromX, y: p.fromY, rotate: p.rotation + (p.fromX < 0 ? -40 : 40), opacity: 0 }}
          animate={{ x: 0, y: 0, rotate: p.rotation, opacity: 0.22 }}
          transition={{ duration: 0.22, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
        >
          <TetrisPiece shape={p.shape} color={p.color} size={p.size} />
        </motion.div>
      ))}
    </div>
  )
}
