'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useState } from 'react'

// ── Item icons ─────────────────────────────────────────────────────────────────

const ITEM_CONFIG: Record<string, { accent: string; icon: React.ReactNode }> = {
  Memory: {
    accent: '#6366F1',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C16.8325 3 20.75 6.91751 20.75 11.75C20.75 16.5825 16.8325 20.5 12 20.5H6.11621L6.72461 21.1084C7.01747 21.4013 7.0174 21.876 6.72461 22.1689C6.43172 22.4618 5.95696 22.4618 5.66406 22.1689L3.71973 20.2246C3.42695 19.9317 3.42687 19.4569 3.71973 19.1641L5.66406 17.2197C5.95692 16.9269 6.43171 16.9269 6.72461 17.2197C7.0175 17.5126 7.0175 17.9874 6.72461 18.2803L6.00488 19H12C16.0041 19 19.25 15.7541 19.25 11.75C19.25 7.74594 16.0041 4.5 12 4.5C7.99594 4.5 4.75 7.74594 4.75 11.75V12C4.75 12.4142 4.41421 12.75 4 12.75C3.58579 12.75 3.25 12.4142 3.25 12V11.75C3.25 6.91751 7.16751 3 12 3Z"/>
      </svg>
    ),
  },
  Emotion: {
    accent: '#EC4899',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.25 10.25L14.0352 4.41843C14.4406 3.09414 12.7114 2.19134 11.8565 3.28093L5.15342 11.8241C4.38109 12.8084 5.08236 14.25 6.33353 14.25H11.75L10.0219 19.6646C9.60158 20.9817 11.3144 21.9057 12.1843 20.8311L18.7717 12.6938C19.5656 11.7131 18.8676 10.25 17.6058 10.25H12.25Z"/>
      </svg>
    ),
  },
  Filter: {
    accent: '#EC4899',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.25 15.5C9.66421 15.5 10 15.8358 10 16.25V17H20.25C20.6642 17 21 17.3358 21 17.75C21 18.1642 20.6642 18.5 20.25 18.5H10V19.25C10 19.6642 9.66421 20 9.25 20C8.83579 20 8.5 19.6642 8.5 19.25V16.25C8.5 15.8358 8.83579 15.5 9.25 15.5ZM5.75 17C6.16421 17 6.5 17.3358 6.5 17.75C6.5 18.1642 6.16421 18.5 5.75 18.5H3.75C3.33579 18.5 3 18.1642 3 17.75C3 17.3358 3.33579 17 3.75 17H5.75ZM17 9.75C17.4142 9.75 17.75 10.0858 17.75 10.5V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H17.75V13.5C17.75 13.9142 17.4142 14.25 17 14.25C16.5858 14.25 16.25 13.9142 16.25 13.5V10.5C16.25 10.0858 16.5858 9.75 17 9.75ZM13.25 11.25C13.6642 11.25 14 11.5858 14 12C14 12.4142 13.6642 12.75 13.25 12.75H3.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25H13.25ZM12 4C12.4142 4 12.75 4.33579 12.75 4.75V5.5H20.25C20.6642 5.5 21 5.83579 21 6.25C21 6.66421 20.6642 7 20.25 7H12.75V7.75C12.75 8.16421 12.4142 8.5 12 8.5C11.5858 8.5 11.25 8.16421 11.25 7.75V4.75C11.25 4.33579 11.5858 4 12 4ZM8.25 5.5C8.66421 5.5 9 5.83579 9 6.25C9 6.66421 8.66421 7 8.25 7H3.75C3.33579 7 3 6.66421 3 6.25C3 5.83579 3.33579 5.5 3.75 5.5H8.25Z"/>
      </svg>
    ),
  },
}

const DEFAULT_ITEMS = ['Memory', 'Emotion', 'Filter']

// ── Sparkle icon for header ────────────────────────────────────────────────────

const IcSparkle = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="rgba(255,255,255,0.6)" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
    <path d="M19 16L19.5 18.5L22 19L19.5 19.5L19 22L18.5 19.5L16 19L18.5 18.5L19 16Z" fill="rgba(255,255,255,0.4)"/>
    <path d="M5 2L5.5 4L8 4.5L5.5 5L5 7L4.5 5L2 4.5L4.5 4L5 2Z" fill="rgba(255,255,255,0.3)"/>
  </svg>
)

// ── Plus button ────────────────────────────────────────────────────────────────

function PlusButton({ visible }: { visible: boolean }) {
  return (
    <div style={{
      width: 18, height: 18,
      borderRadius: 5,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.15s, background 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)' }}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M4 1v6M1 4h6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// ── AgentContextNode ───────────────────────────────────────────────────────────

export interface AgentContextNodeData {
  items?: string[]
  [key: string]: unknown
}

export function AgentContextNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const nodeData = data as AgentContextNodeData
  const items = nodeData.items ?? DEFAULT_ITEMS

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setHoveredItem(null) }}
      style={{
        width: 224,
        background: '#0F1117',
        border: `1px solid ${selected ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16,
        boxShadow: selected
          ? '0 0 0 1px rgba(139,92,246,0.3), 0 8px 32px rgba(0,0,0,0.7)'
          : '0 4px 24px rgba(0,0,0,0.6)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 12px 10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <IcSparkle />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary, #E6EAF2)',
            letterSpacing: '-0.01em',
          }}>
            Agent Context
          </div>
          <div style={{
            fontSize: 8, fontWeight: 500,
            color: 'var(--text-tertiary, #7D879A)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginTop: 1,
          }}>
            Context Builder
          </div>
        </div>
        <PlusButton visible={hovered} />
      </div>

      {/* Item list */}
      <div style={{ padding: '8px 8px 10px' }}>
        {items.map(item => {
          const cfg = ITEM_CONFIG[item] ?? { accent: '#6B7280', icon: null }
          const isHovered = hoveredItem === item
          return (
            <div
              key={item}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 8px 7px 10px',
                borderRadius: 10,
                background: isHovered ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 4,
                cursor: 'default',
                transition: 'background 0.12s',
              }}
            >
              {/* Item icon */}
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                background: `${cfg.accent}1A`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.accent,
              }}>
                {cfg.icon}
              </div>

              {/* Item name */}
              <span style={{
                flex: 1,
                fontSize: 11, fontWeight: 500,
                color: 'var(--text-primary, #E6EAF2)',
                letterSpacing: '-0.005em',
              }}>
                {item}
              </span>

              <PlusButton visible={isHovered} />
            </div>
          )
        })}
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'radial-gradient(circle at center, #fff 38%, rgba(255,255,255,0.55) 38%)',
          border: '1.5px solid rgba(255,255,255,0.45)',
          left: -5,
          transition: 'transform 0.15s ease, opacity 0.15s',
        }}
      />

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: 'radial-gradient(circle at center, #fff 38%, #8B5CF6 38%)',
          border: '1.5px solid #8B5CF6',
          right: -5,
          transition: 'transform 0.15s ease, opacity 0.15s',
        }}
      />
    </div>
  )
}
