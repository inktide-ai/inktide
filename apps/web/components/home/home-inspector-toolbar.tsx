'use client'
import type { ReactNode } from 'react'
import type { HubTabId } from '@/hooks/useHubLayout'
import {
  IconUser, IconPaint, IconSkills, IconScene, IconObs,
} from '@/components/profile/tab-icons'

// ── Design tokens ────────────────────────────────────────────────────────────
const BG     = '#0A0B0F'
const BORDER = 'rgba(255,255,255,0.06)'
const ACTIVE = '#E6EAF2'

// Per-tab accent colors — only tabs shown on /home
const ACCENT: Partial<Record<HubTabId, string>> = {
  profile: '#a78bfa',
  skills:  '#fbbf24',
  avatars: '#e879f9',
  scene:   '#22d3ee',
  obs:     '#fb7185',
}

const ACCENT_BG: Partial<Record<HubTabId, string>> = {
  profile: 'rgba(139,92,246,0.12)',
  skills:  'rgba(245,158,11,0.10)',
  avatars: 'rgba(217,70,239,0.10)',
  scene:   'rgba(6,182,212,0.10)',
  obs:     'rgba(244,63,94,0.10)',
}

const ACCENT_BORDER: Partial<Record<HubTabId, string>> = {
  profile: 'rgba(139,92,246,0.20)',
  skills:  'rgba(245,158,11,0.18)',
  avatars: 'rgba(217,70,239,0.18)',
  scene:   'rgba(6,182,212,0.18)',
  obs:     'rgba(244,63,94,0.18)',
}

interface ToolItem {
  id: HubTabId
  label: string
  icon: ReactNode | null
}

const GROUP_CHARACTER: ToolItem[] = [
  { id: 'profile', label: 'Profile', icon: <IconUser /> },
  { id: 'avatars', label: 'Avatars', icon: <IconPaint /> },
  { id: 'skills',  label: 'Skills',  icon: <IconSkills /> },
]

const GROUP_ENVIRONMENT: ToolItem[] = [
  { id: 'scene', label: 'Scene', icon: <IconScene /> },
  { id: 'obs',   label: 'OBS',   icon: <IconObs /> },
]

interface Props {
  activeTab: HubTabId | null
  onSelect: (id: HubTabId) => void
}

function ToolButton({ item, isActive, onSelect }: {
  item: ToolItem
  isActive: boolean
  onSelect: (id: HubTabId) => void
}) {
  const accent = ACCENT[item.id] ?? '#ffffff'
  return (
    <div className="relative group/btn flex items-center justify-center" style={{ width: 44, height: 36 }}>
      {/* Active left indicator bar */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
          style={{ width: 2, height: 18, background: accent }}
        />
      )}

      <button
        type="button"
        onClick={() => onSelect(item.id)}
        title={item.label}
        className="flex items-center justify-center rounded-[6px] transition-all duration-100 [&>svg]:w-[14px] [&>svg]:h-[14px]"
        style={{
          width: 32,
          height: 32,
          // Always show the colored bg + border like settings hub cards
          background: isActive ? (ACCENT_BG[item.id] ?? '') : `${(ACCENT_BG[item.id] ?? '').replace('0.12', '0.07').replace('0.10', '0.06')}`,
          border: `1px solid ${isActive ? (ACCENT_BORDER[item.id] ?? 'transparent') : 'transparent'}`,
          color: accent,
          cursor: 'pointer',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!isActive) {
            ;(e.currentTarget as HTMLElement).style.background = ACCENT_BG[item.id] ?? ''
            ;(e.currentTarget as HTMLElement).style.border = `1px solid ${ACCENT_BORDER[item.id] ?? 'transparent'}`
            ;(e.currentTarget as HTMLElement).style.color = accent
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            const dimBg = (ACCENT_BG[item.id] ?? '').replace('0.12', '0.07').replace('0.10', '0.06')
            ;(e.currentTarget as HTMLElement).style.background = dimBg
            ;(e.currentTarget as HTMLElement).style.border = '1px solid transparent'
            ;(e.currentTarget as HTMLElement).style.color = accent
          }
        }}
      >
        {item.icon}
      </button>

      {/* Tooltip — appears to the left of the toolbar */}
      <div
        className="absolute right-[calc(100%+10px)] top-1/2 -translate-y-1/2 pointer-events-none
          opacity-0 group-hover/btn:opacity-100 transition-opacity duration-100
          px-2 py-1 rounded-md text-[14px] font-medium whitespace-nowrap z-50"
        style={{
          background: '#262625',
          color: ACTIVE,
          boxShadow: '0 0 0 1px #343433, 0 4px 16px rgba(0,0,0,0.6)',
        }}
      >
        {item.label}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div
      className="mx-auto my-1.5"
      style={{ width: 24, height: 1, background: BORDER }}
    />
  )
}

export default function HomeInspectorToolbar({ activeTab, onSelect }: Props) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center overflow-y-auto py-2"
      style={{
        width: 44,
        background: BG,
        borderLeft: `1px solid ${BORDER}`,
      }}
    >
      {GROUP_CHARACTER.map(item => (
        <ToolButton
          key={item.id}
          item={item}
          isActive={activeTab === item.id}
          onSelect={onSelect}
        />
      ))}

      <Divider />

      {GROUP_ENVIRONMENT.map(item => (
        <ToolButton
          key={item.id}
          item={item}
          isActive={activeTab === item.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
