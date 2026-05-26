'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

// ── Grid metrics ──────────────────────────────────────────────────────────────

const CELL = 14   // block size in px  (+17% from 12)
const S    = 16   // step = cell + 2 px gap

// ── Piece colours — matched to the app's dark purple palette ─────────────────
// Background is near-black (#06070B), accent is purple (#6c47ff).
// Three shades from white → violet give clean contrast and stay in-theme.
const PIECE_COLORS = [
  '#E6EAF2',  // D — near-white  (--text-primary)
  '#a78bfa',  // E — light violet (accent family, lighter)
  '#8B5CF6',  // V — medium violet (--accent-red-bright)
]

// ── Letter bitmaps [row][col] — 1 = filled ────────────────────────────────────

// 5 rows — same height as V
const D_MAP = [
  [1,1,1,0],  // ###.
  [1,0,0,1],  // #..#
  [1,0,0,1],  // #..#  ← 3 middle rows
  [1,0,0,1],  // #..#
  [1,1,1,0],  // ###.
] as const

const E_MAP = [
  [1,1,1,1],  // ####
  [1,0,0,0],  // #...
  [1,1,1,0],  // ###.
  [1,0,0,0],  // #...
  [1,1,1,1],  // ####
] as const

// V converges to a point — 5 wide × 5 tall
const V_MAP = [
  [1,0,0,0,1],
  [1,0,0,0,1],
  [0,1,0,1,0],
  [0,1,0,1,0],
  [0,0,1,0,0],
] as const

// Letter column offsets:
//   D: cols  0–3   (4 wide)
//   gap at   col 4
//   E: cols  5–8   (4 wide)
//   gap at   col 9
//   V: cols 10–14  (5 wide)
const LETTERS = [
  { map: D_MAP as readonly (readonly number[])[], colOffset: 0  },
  { map: E_MAP as readonly (readonly number[])[], colOffset: 5  },
  { map: V_MAP as readonly (readonly number[])[], colOffset: 10 },
]

// ── Container dimensions ──────────────────────────────────────────────────────

const WRAP_W   = 262
const WRAP_H   = 200
const GRID_H   = 4 * S + CELL   // 68 px  (rows 0–4, all three letters are 5 rows tall)
const GRID_TOP = WRAP_H - GRID_H  // 98 px — letter grid sits at the bottom of the wrapper

// ── Timing ────────────────────────────────────────────────────────────────────
//
//  In Tetris, one piece falls at a time at constant speed (no bounce),
//  locks hard, then the next piece spawns.
//
//  FALL_DUR   — how long a single piece takes to fall into position (seconds)
//  PIECE_GAP  — brief pause after each piece lands before the next spawns
//
const FALL_DUR   = 0.60   // s — slow enough to clearly see the fall
const PIECE_GAP  = 0.12   // s — small pause between pieces
const PIECE_PERIOD = FALL_DUR + PIECE_GAP   // 0.72 s per piece

// ── Column-group data ─────────────────────────────────────────────────────────
//
//  Each distinct column with blocks is one "piece":
//  all blocks in that column fall together as a rigid vertical strip.
//

interface ColGroup {
  col:      number          // absolute column index (0–14)
  pieceIdx: number          // spawn order (0, 1, 2 … left-to-right)
  rows:     number[]        // which rows have a block
  color:    string          // piece colour
  // Initial y-offset for the group container so ALL blocks start above the visible area
  startY:   number
}

function buildGroups(): ColGroup[] {
  const colMap = new Map<number, { rows: number[]; li: number; ci: number }>()

  LETTERS.forEach(({ map, colOffset }, li) => {
    map.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (!cell) return
        const absCol = colOffset + ci
        if (!colMap.has(absCol)) colMap.set(absCol, { rows: [], li, ci })
        colMap.get(absCol)!.rows.push(ri)
      })
    })
  })

  return Array.from(colMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([col, { rows, li }], pieceIdx) => {
      const maxRow = Math.max(...rows)

      // The group div sits at top=0 in the wrapper and uses a y-transform.
      // For ALL blocks to be above the wrapper (hidden by overflow:hidden) at start,
      // we need:  startY + maxRow*S + CELL  <  0
      // → startY = -(maxRow*S + CELL + 16)   (16 px breathing room)
      const startY = -(maxRow * S + CELL + 16)

      return {
        col,
        pieceIdx,
        rows,
        color: PIECE_COLORS[li % PIECE_COLORS.length],
        startY,
      }
    })
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Tetris-style animation: column-pieces fall one at a time (left → right),
 * lock into place at constant speed (no bounce), collectively spelling **DEV**.
 * After all pieces land they hold for 2 s, then fade out and the cycle repeats.
 */
export function TetrisDev() {
  const groups = useMemo(buildGroups, [])
  const N = groups.length   // 13 distinct columns

  // ── Cycle timing ────────────────────────────────────────────────────────────
  const fillEnd  = N * PIECE_PERIOD             // all pieces have landed
  const holdEnd  = fillEnd + 2.0                // hold DEV for 2 s
  const fadeEnd  = holdEnd + 0.55               // fade-out duration
  const CYCLE    = Math.ceil(fadeEnd + 0.65)    // total cycle, ≈ 13 s

  return (
    <div
      style={{
        position: 'relative',
        width:    WRAP_W,
        height:   WRAP_H,
        overflow: 'hidden',
      }}
    >
      {groups.map(({ col, pieceIdx, rows, color, startY }) => {
        // Absolute times (seconds) for this piece's lifecycle:
        const tStart = pieceIdx * PIECE_PERIOD   // piece spawns (starts falling)
        const tLand  = tStart + FALL_DUR         // piece locks into position

        // Fractions of the cycle for the keyframes array:
        //  [0]          start of cycle — above wrapper, invisible
        //  [tStart/C]   begin falling  — still above, opacity stays 0
        //  [tLand/C]    piece locks    — at final position, opacity → 1
        //  [holdEnd/C]  hold phase end — start fading
        //  [fadeEnd/C]  fade complete  — invisible again
        //  [1]          end of cycle
        const t0 = 0
        const t1 = Math.max(0.001, tStart / CYCLE)
        const t2 = tLand   / CYCLE
        const t3 = holdEnd / CYCLE
        const t4 = fadeEnd / CYCLE
        const t5 = 1

        return (
          // One motion.div per column-piece.
          // left = column position, top = 0 in wrapper.
          // y animates from startY (above wrapper) → GRID_TOP (letter position).
          <motion.div
            key={col}
            style={{ position: 'absolute', left: 10 + col * S, top: 0 }}
            animate={{
              y:       [startY, startY, GRID_TOP, GRID_TOP, startY, startY],
              opacity: [0,      0,      1,        1,        0,      0     ],
            }}
            transition={{
              duration:    CYCLE,
              times:       [t0, t1, t2, t3, t4, t5],
              // Segment easings (5 segments for 6 keyframes):
              //  [0→1] linear  — waiting above (no movement)
              //  [1→2] linear  — Tetris constant-speed fall (no acceleration)
              //  [2→3] linear  — locked, static
              //  [3→4] easeIn  — rise while fading out
              //  [4→5] linear  — above (no movement)
              ease:        ['linear', 'linear', 'linear', 'easeIn', 'linear'] as never,
              repeat:      Infinity,
              repeatDelay: 0,
            }}
          >
            {rows.map((row) => (
              <div
                key={row}
                style={{
                  position:     'absolute',
                  top:          row * S,
                  width:        CELL,
                  height:       CELL,
                  borderRadius: 2,
                  // Flat solid fill — exactly as in the Lottie source (no gradient, no glow)
                  background:   color,
                  boxShadow:    'none',
                }}
              />
            ))}
          </motion.div>
        )
      })}
    </div>
  )
}
