'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { CharacterPersonality } from '@/shared/lib/character/types'

interface AnimatedMoodFaceProps {
  personality: CharacterPersonality
}


function getMoodColors(p: CharacterPersonality): {
  bg: string
  border: string
  stroke: string
} {
  const { baselineMood: mood, warmth, emotionVolatility: vol, sarcasm } = p

  if (mood === 'happy')       return { bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.20)',  stroke: '#ca8a04' }
  if (mood === 'hyped')       return { bg: 'rgba(236,72,153,0.09)',  border: 'rgba(236,72,153,0.18)',  stroke: '#db2777' }
  if (mood === 'chill')       return { bg: 'rgba(96,165,250,0.09)',  border: 'rgba(96,165,250,0.18)',  stroke: '#3b82f6' }
  if (mood === 'melancholic') return { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', stroke: '#64748b' }

  if (sarcasm > 0.6)   return { bg: 'rgba(99,102,241,0.09)',  border: 'rgba(99,102,241,0.18)',  stroke: '#6366f1' }
  if (vol > 0.65)      return { bg: 'rgba(239,68,68,0.09)',   border: 'rgba(239,68,68,0.18)',   stroke: '#ef4444' }
  if (warmth > 0.65)   return { bg: 'rgba(245,158,11,0.09)',  border: 'rgba(245,158,11,0.18)',  stroke: '#d97706' }
  return               { bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.18)', stroke: '#8b5cf6' }
}

// M lx ly Q cx cy rx ry  (quadratic bezier, same structure for all -> Framer can interpolate)

function getMouthPath(p: CharacterPersonality): string {
  const moodScore: Record<string, number> = {
    happy: 0.9, hyped: 0.65, chill: 0.1, neutral: 0, melancholic: -0.7,
  }
  const mood = moodScore[p.baselineMood] ?? 0
  const smile = p.warmth * 0.45 + mood * 0.55  // -0.5 -> 1

  // Control point: higher y = more smile in SVG (y-down)
  const cy = 16 + smile * 3.2                   // 12.8 (frown) -> 19.2 (big smile)

  // Smirk: shift right endpoint up if sarcasm is high
  const smirkShift = p.sarcasm * 2.4
  const ry = 15 - smirkShift                    // right side of mouth
  const ly = 15 + smirkShift * 0.25             // left side slight compensation

  return `M 7 ${ly.toFixed(2)} Q 12 ${cy.toFixed(2)} 17 ${ry.toFixed(2)}`
}


function getEyeShape(p: CharacterPersonality) {
  const mood = p.baselineMood
  // Happy/hyped -> squinted (small ry)
  const squint = mood === 'happy' ? 0.8 : mood === 'hyped' ? 0.9 : 1.4
  // Volatile -> wide eyes (large ry)
  const wide = 1 + p.emotionVolatility * 0.5
  const ry = squint * wide
  // Sarcasm -> one eye more closed
  return { ry: Math.max(0.6, Math.min(2.2, ry)), sarcasmSquint: p.sarcasm }
}


export function AnimatedMoodFace({ personality }: AnimatedMoodFaceProps) {
  const colors    = useMemo(() => getMoodColors(personality), [personality])
  const mouthPath = useMemo(() => getMouthPath(personality), [personality])
  const eyeShape  = useMemo(() => getEyeShape(personality),  [personality])

  const rightEyeRy = Math.max(0.6, eyeShape.ry - eyeShape.sarcasmSquint * 0.8)

  return (
    <motion.div
      className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 relative"
      animate={{
        background: colors.bg,
        borderColor: colors.border,
      }}
      transition={{ duration: 0.55, ease: 'easeInOut' }}
      style={{ border: '1px solid', borderColor: colors.border }}
    >
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" aria-hidden>

        {/* Left eye */}
        <motion.ellipse
          cx={8} cy={9}
          rx={1.4}
          animate={{ ry: eyeShape.ry, stroke: colors.stroke }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="transparent"
        />

        {/* Right eye - smirk squints this one */}
        <motion.ellipse
          cx={16} cy={9}
          rx={1.4}
          animate={{ ry: rightEyeRy, stroke: colors.stroke }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="transparent"
        />

        {/* Mouth */}
        <motion.path
          animate={{ d: mouthPath, stroke: colors.stroke }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="transparent"
        />

      </svg>

    </motion.div>
  )
}
