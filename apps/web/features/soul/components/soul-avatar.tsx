'use client'

import type { CSSProperties } from 'react'

// Gradient palette — deterministic, indexed by cardHash(id)
const GRADIENT_PALETTE: Array<[string, string]> = [
  ['#1a1f2e', '#2d1b4e'],
  ['#0f2027', '#1b3a4b'],
  ['#1a0533', '#3d1a6e'],
  ['#1c1c2e', '#16213e'],
  ['#12100e', '#2b2b2b'],
  ['#1a1b2e', '#0d1b2a'],
  ['#2c0735', '#4a1259'],
  ['#0a1628', '#1e3a5f'],
]

function soulGradient(id: string): [string, string] {
  let h = 5381
  for (let i = 0; i < id.length; i++) h = (((h << 5) + h) + id.charCodeAt(i)) | 0
  return GRADIENT_PALETTE[Math.abs(h) % GRADIENT_PALETTE.length]
}

interface SoulAvatarProps {
  avatarUrl: string | null | undefined
  name: string
  id: string
  /** Applied to <img> when avatarUrl is set */
  imgClassName?: string
  imgStyle?: CSSProperties
}

/**
 * Renders the soul's avatar image, or a letter-based gradient placeholder
 * if no avatar URL is set. The SVG placeholder scales to any container size.
 */
export function SoulAvatar({ avatarUrl, name, id, imgClassName, imgStyle }: SoulAvatarProps) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={imgClassName} style={imgStyle} />
  }

  const [from, to] = soulGradient(id)
  const letter     = (name.charAt(0) || '?').toUpperCase()
  const gradId     = `sg-${id.replace(/-/g, '').slice(0, 12)}`

  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      className={imgClassName}
      style={imgStyle}
      aria-label={name}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradId})`} />
      <text
        x="50"
        y="50"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="42"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
        fill="white"
        opacity="0.92"
      >
        {letter}
      </text>
    </svg>
  )
}
