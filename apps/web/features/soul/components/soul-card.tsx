'use client'

import { useTheme } from 'next-themes'
import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SoulStatus = 'online' | 'active' | 'idle' | 'offline'
export type SoulPlatform = 'discord' | 'twitch' | 'browser' | 'youtube' | 'telegram'

export interface SoulCardData {
  id: string
  name: string
  subtitle: string
  description?: string
  avatarUrl: string
  accentColor: string
  status: SoulStatus
  platforms: SoulPlatform[]
}

interface SoulCardProps {
  data: SoulCardData
  /** Card width in px. Pass 0 to fill container width. */
  width: number
  isFavorite: boolean
  onFavoriteToggle: () => void
  onOpen: () => void
}

// ── Layout constants (design reference at BASE_WIDTH) ─────────────────────────

const BASE_WIDTH      = 420
/** Left image column width */
const BASE_IMG_WIDTH  = 130
const BASE_RADIUS     = 16
/** Content area padding (all sides) */
const BASE_PAD        = 16
const BASE_STAR       = 34
const BASE_NAME       = 22
const BASE_SUB        = 11
const BASE_DESC       = 14
const BASE_DESC_LH    = 1.5
const GAP_BADGE       = 10   // below badge row
const GAP_NAME        = 4    // below name
const GAP_SUB         = 12   // below subtitle

/** Bottom button-row vertical padding */

const BASE_BTN_PAD_V  = 12
const BASE_BTN_H      = 42
const BASE_BTN_R      = 10
const GAP_BTNS        = 8

const CARD_SURFACE  = 'hsla(var(--bg-2), 1)'
const DIVIDER_DARK  = 'var(--border-card, #1a1a1a)'
const DIVIDER_LIGHT = 'var(--border-default, #e4e2df)'
const BORDER_DARK   = 'color-mix(in srgb, var(--border-card, #1a1a1a) 68%, transparent)'
const BORDER_DARK_H = 'color-mix(in srgb, var(--accent-base, #6c47ff) 32%, color-mix(in srgb, var(--border-card, #1a1a1a) 68%, transparent))'

// ── Status ────────────────────────────────────────────────────────────────────

function StatusBadge({ status, label, s }: { status: SoulStatus; label: string; s: (v: number) => number }) {
  const isActive = status === 'online' || status === 'active'
  const dotColor = isActive ? 'var(--stat-accent-success)' : 'var(--text-tertiary)'

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: s(5), flexShrink: 0 }}>
      <div style={{ width: s(7), height: s(7), borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <span style={{ fontSize: s(12), fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1, color: dotColor }}>
        {label}
      </span>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcStarEmpty = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2.25C12.2847 2.25 12.5451 2.41111 12.6719 2.66602L15.2774 7.90918L21.1074 8.75098C21.3905 8.79192 21.6258 8.99062 21.7139 9.2627C21.8018 9.53483 21.727 9.8333 21.5215 10.0322L17.3067 14.1123L18.3018 19.8721C18.3503 20.1532 18.2344 20.4373 18.0039 20.6055C17.7735 20.7735 17.4676 20.797 17.2149 20.665L12 17.9414L6.78517 20.665C6.53237 20.797 6.22649 20.7735 5.99611 20.6055C5.76576 20.4373 5.64973 20.1531 5.69826 19.8721L6.6924 14.1123L2.47853 10.0322C2.27311 9.83331 2.19823 9.53478 2.28615 9.2627C2.37417 8.99064 2.60964 8.79198 2.8926 8.75098L8.7217 7.90918L11.3281 2.66602L11.3819 2.5752C11.5204 2.37351 11.7509 2.25006 12 2.25ZM9.89064 8.92969C9.78102 9.1502 9.5699 9.30263 9.32619 9.33789L4.61916 10.0166L8.0215 13.3105C8.19965 13.483 8.28132 13.7322 8.23928 13.9766L7.43459 18.6328L11.6533 16.4316L11.7363 16.3936C11.9345 16.3192 12.1565 16.3325 12.3467 16.4316L16.5645 18.6328L15.7608 13.9766C15.7187 13.7323 15.8005 13.483 15.9785 13.3105L19.3799 10.0166L14.6738 9.33789C14.4302 9.30258 14.219 9.15018 14.1094 8.92969L12 4.68555L9.89064 8.92969Z" fill="currentColor"/>
  </svg>
)

const IcStarFilled = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M11.9999 2.25C12.2846 2.25 12.545 2.41111 12.6718 2.66602L15.2772 7.90918L21.1073 8.75098C21.3903 8.79192 21.6257 8.99062 21.7137 9.2627C21.8017 9.53483 21.7269 9.8333 21.5214 10.0322L17.3065 14.1123L18.3016 19.8721C18.3502 20.1532 18.2342 20.4373 18.0038 20.6055C17.7734 20.7735 17.4675 20.797 17.2147 20.665L11.9999 17.9414L6.78503 20.665C6.53223 20.797 6.22635 20.7735 5.99597 20.6055C5.76562 20.4373 5.64959 20.1531 5.69812 19.8721L6.69226 14.1123L2.47839 10.0322C2.27297 9.83331 2.19809 9.53478 2.28601 9.2627C2.37403 8.99064 2.6095 8.79198 2.89246 8.75098L8.72156 7.90918L11.328 2.66602L11.3817 2.5752C11.5203 2.37351 11.7508 2.25006 11.9999 2.25Z" fill="currentColor"/>
  </svg>
)

const IcPlay = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 26" fill="none">
    <path d="M1.5 22.7355V2.73555L16.5 12.3008L1.5 22.7355Z" stroke="currentColor" strokeWidth="3"/>
  </svg>
)

const IcDots = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 30 24" fill="none">
    <circle cx="3.5" cy="12" r="3.5" fill="currentColor"/>
    <circle cx="15" cy="12" r="3.5" fill="currentColor"/>
    <circle cx="26.5" cy="12" r="3.5" fill="currentColor"/>
  </svg>
)

function readLightClass(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('light')
}

// ── Card ──────────────────────────────────────────────────────────────────────

export function SoulCard({ data, width, isFavorite, onFavoriteToggle, onOpen }: SoulCardProps) {
  const { t } = useTranslation('common')
  const { resolvedTheme } = useTheme()
  const [docLight, setDocLight] = useState(readLightClass)
  useLayoutEffect(() => { setDocLight(readLightClass()) }, [resolvedTheme])
  const isLight = resolvedTheme === 'light' || (resolvedTheme === undefined && docLight)

  const STATUS_LABEL: Record<SoulStatus, string> = {
    online:  t('soulCard.online'),
    active:  t('soulCard.active'),
    idle:    t('soulCard.idle'),
    offline: t('soulCard.offline'),
  }

  const [hovered, setHovered] = useState(false)
  const outerRef = useRef<HTMLDivElement | null>(null)
  const [measured, setMeasured] = useState(400)

  useEffect(() => {
    if (width !== 0) return
    const el = outerRef.current
    if (!el) return
    const ro = new ResizeObserver(e => {
      const w = e[0]?.contentRect.width ?? 0
      if (w > 0) setMeasured(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  const eff = width === 0 ? measured : width
  const scale = eff / BASE_WIDTH
  const s = (v: number) => v * scale

  const cardBorder = isLight
    ? `1px solid ${DIVIDER_LIGHT}`
    : `1px solid ${hovered ? BORDER_DARK_H : BORDER_DARK}`

  const cardShadow = isLight
    ? (hovered ? '0 8px 24px rgba(15,15,15,0.10),0 2px 6px rgba(15,15,15,0.06)' : '0 1px 3px rgba(15,15,15,0.06),0 2px 8px rgba(15,15,15,0.05)')
    : (hovered ? 'var(--elevation-card-hover)' : 'var(--elevation-card)')

  const descText = data.description?.trim() || ' '

  return (
    <div
      ref={outerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: width === 0 ? '100%' : width,
        borderRadius: s(BASE_RADIUS),
        border: cardBorder,
        boxShadow: cardShadow,
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.2s',
        cursor: 'default',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', background: CARD_SURFACE }}>

        {/* ── TOP ROW: image (left) + content (right) ── */}
        <div style={{ display: 'flex', flexDirection: 'row' }}>

          {/* Image column */}
          <div style={{ width: s(BASE_IMG_WIDTH), flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            <img
              src={data.avatarUrl}
              alt={data.name}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
            />
          </div>

          {/* Content column */}
          <div style={{ flex: 1, minWidth: 0, padding: s(BASE_PAD), display: 'flex', flexDirection: 'column' }}>

            {/* Status + star row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: s(GAP_BADGE) }}>
              <StatusBadge status={data.status} label={STATUS_LABEL[data.status]} s={s} />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onFavoriteToggle() }}
                style={{
                  width: s(BASE_STAR), height: s(BASE_STAR), flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', borderRadius: '50%',
                  cursor: 'pointer', padding: 0,
                  color: isLight
                    ? (isFavorite ? '#d97706' : '#9ca3af')
                    : (isFavorite ? '#facc15' : 'var(--text-secondary, #888888)'),
                  transition: 'color 0.15s',
                }}
                title={isFavorite ? t('soulCard.removeFavorite') : t('soulCard.addFavorite')}
              >
                {isFavorite ? <IcStarFilled size={s(18)} /> : <IcStarEmpty size={s(18)} />}
              </button>
            </div>

            {/* Name */}
            <div style={{ fontSize: s(BASE_NAME), fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: s(GAP_NAME), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data.name}
            </div>

            {/* Subtitle */}
            <div style={{ fontSize: s(BASE_SUB), fontWeight: 400, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: s(GAP_SUB), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {data.subtitle}
            </div>

            {/* Description */}
            <div style={{ fontSize: s(BASE_DESC), fontWeight: 400, color: 'var(--text-primary)', lineHeight: BASE_DESC_LH, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' as const, WebkitLineClamp: 3, minHeight: s(BASE_DESC * BASE_DESC_LH * 3) }}>
              {descText}
            </div>

          </div>
        </div>

        {/* ── DIVIDER ── */}
        <div style={{ height: 1, background: isLight ? DIVIDER_LIGHT : DIVIDER_DARK, flexShrink: 0 }} />

        {/* ── BOTTOM: full-width buttons ── */}
        <div style={{ display: 'flex', gap: s(GAP_BTNS), padding: `${s(BASE_BTN_PAD_V)}px ${s(BASE_PAD)}px` }}>
          <button
            type="button"
            onClick={onOpen}
            style={{
              flex: 1, minWidth: 0, height: s(BASE_BTN_H), boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: s(7),
              background: 'transparent',
              border: `${s(1)}px solid ${isLight ? 'var(--border-default, #e4e2df)' : 'var(--border-default, rgba(255,255,255,0.12))'}`,
              borderRadius: s(BASE_BTN_R), color: 'var(--text-primary)',
              fontSize: s(13), fontWeight: 600, fontFamily: 'Inter, system-ui, sans-serif',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isLight ? 'rgba(55,53,47,0.05)' : 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <IcPlay size={s(12)} />
            {t('soulCard.open')}
          </button>

          <button
            type="button"
            style={{
              width: s(BASE_BTN_H), height: s(BASE_BTN_H), boxSizing: 'border-box', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: `${s(1)}px solid ${isLight ? 'var(--border-default, #e4e2df)' : 'var(--border-default, rgba(255,255,255,0.12))'}`,
              borderRadius: s(BASE_BTN_R), color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'background 0.12s', padding: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isLight ? 'rgba(55,53,47,0.05)' : 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            title={t('soulCard.moreOptions')}
          >
            <IcDots size={s(15)} />
          </button>
        </div>

      </div>
    </div>
  )
}
