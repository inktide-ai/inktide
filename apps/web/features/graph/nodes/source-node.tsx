'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useState } from 'react'

// ── Platform config ────────────────────────────────────────────────────────────

type Platform = 'discord' | 'telegram' | 'twitch'

const PLATFORM: Record<Platform, { label: string; accent: string; icon: React.ReactNode }> = {
  discord: {
    label: 'Discord',
    accent: '#5865F2',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  telegram: {
    label: 'Telegram',
    accent: '#2CA5E0',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  twitch: {
    label: 'Twitch',
    accent: '#9146FF',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
      </svg>
    ),
  },
}

// ── Plus button ────────────────────────────────────────────────────────────────

function PlusButton() {
  return (
    <div style={{
      width: 20, height: 20,
      borderRadius: 6,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      flexShrink: 0,
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path d="M4.5 1v7M1 4.5h7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// ── SourceNode ─────────────────────────────────────────────────────────────────

export interface SourceNodeData {
  platform: Platform
  [key: string]: unknown
}

export function SourceNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const nodeData = data as SourceNodeData
  const cfg = PLATFORM[nodeData.platform] ?? PLATFORM.discord

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 164,
        background: '#0F1117',
        border: `1px solid ${selected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 1px ${cfg.accent}33, 0 4px 24px rgba(0,0,0,0.6)`
          : '0 2px 16px rgba(0,0,0,0.5)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* Accent left strip */}
      <div style={{
        position: 'absolute',
        left: 0, top: 10, bottom: 10,
        width: 3,
        borderRadius: '0 2px 2px 0',
        background: cfg.accent,
        opacity: 0.9,
      }} />

      {/* Content */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 10, padding: '13px 12px 13px 16px',
      }}>
        {/* Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${cfg.accent}1A`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cfg.accent,
        }}>
          {cfg.icon}
        </div>

        {/* Labels */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary, #E6EAF2)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {cfg.label}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 500,
            color: 'var(--text-tertiary, #7D879A)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}>
            {nodeData.platform}
          </div>
        </div>

        {/* Plus button */}
        <div style={{ opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <PlusButton />
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10, height: 10,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, #fff 38%, ${cfg.accent} 38%)`,
          border: `1.5px solid ${cfg.accent}`,
          right: -5,
          transition: 'transform 0.15s ease, opacity 0.15s',
        }}
      />
    </div>
  )
}
