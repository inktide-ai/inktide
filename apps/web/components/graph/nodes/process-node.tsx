'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useState } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────────

const ICONS = {
  input: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.25 2.9996C10.6641 2.9996 10.9998 3.33557 11 3.7496C11 4.16382 10.6642 4.4996 10.25 4.4996H5.25C4.83592 4.4996 4.50021 4.83557 4.5 5.2496V18.7496C4.5 19.1638 4.83579 19.4996 5.25 19.4996H18.75C19.1642 19.4996 19.5 19.1638 19.5 18.7496V13.7496C19.5002 13.3356 19.8359 12.9996 20.25 12.9996C20.6641 12.9996 20.9998 13.3356 21 13.7496V18.7496C21 19.9922 19.9926 20.9996 18.75 20.9996H5.25C4.00736 20.9996 3 19.9922 3 18.7496V5.2496C3.00021 4.00714 4.00749 2.9996 5.25 2.9996H10.25ZM19.7197 3.21933C20.0126 2.92685 20.4875 2.92678 20.7803 3.21933C21.073 3.51219 21.0729 3.98705 20.7803 4.27988L16.0576 8.9996H19.25C19.6641 8.9996 19.9998 9.33557 20 9.7496C20 10.1638 19.6642 10.4996 19.25 10.4996H14.25C14.0756 10.4996 13.9174 10.4374 13.79 10.3375C13.7808 10.3303 13.7717 10.3228 13.7627 10.315C13.7341 10.2904 13.7072 10.2646 13.6826 10.2359C13.6741 10.2261 13.6661 10.2158 13.6582 10.2057C13.5606 10.079 13.5 9.92186 13.5 9.7496V4.7496C13.5002 4.33557 13.8359 3.9996 14.25 3.9996C14.6641 3.9996 14.9998 4.33557 15 4.7496V7.93515L19.7197 3.21933Z"/>
    </svg>
  ),
  llm: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 11.5858 2.33579 11.25 2.75 11.25C3.16421 11.25 3.5 11.5858 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5C11.5858 3.5 11.25 3.16421 11.25 2.75C11.25 2.33579 11.5858 2 12 2ZM12 6.4502C12.4142 6.4502 12.75 6.78598 12.75 7.2002V11.5361L15.9355 13.1289C16.306 13.3142 16.4557 13.7653 16.2705 14.1357C16.0851 14.5059 15.635 14.6558 15.2646 14.4707L11.665 12.6709C11.411 12.5439 11.2501 12.284 11.25 12V7.2002C11.25 6.78598 11.5858 6.4502 12 6.4502ZM3.375 7.7793C3.85821 7.7793 4.24993 8.1711 4.25 8.6543C4.25 9.13755 3.85825 9.5293 3.375 9.5293C2.89175 9.5293 2.5 9.13755 2.5 8.6543C2.50007 8.1711 2.89179 7.7793 3.375 7.7793ZM5.47852 4.60352C5.96154 4.60378 6.35352 4.99543 6.35352 5.47852C6.35325 5.96138 5.96138 6.35325 5.47852 6.35352C4.99543 6.35352 4.60378 5.96154 4.60352 5.47852C4.60352 4.99527 4.99527 4.60352 5.47852 4.60352ZM8.625 2.5C9.10825 2.5 9.5 2.89175 9.5 3.375C9.5 3.85825 9.10825 4.25 8.625 4.25C8.14175 4.25 7.75 3.85825 7.75 3.375C7.75 2.89175 8.14175 2.5 8.625 2.5Z"/>
    </svg>
  ),
  tts: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.25 2C10.6642 2 11 2.33579 11 2.75V21.25C11 21.6642 10.6642 22 10.25 22C9.83579 22 9.5 21.6642 9.5 21.25V2.75C9.5 2.33579 9.83579 2 10.25 2ZM17.75 5.25C18.1642 5.25 18.5 5.58579 18.5 6V18C18.5 18.4142 18.1642 18.75 17.75 18.75C17.3358 18.75 17 18.4142 17 18V6C17 5.58579 17.3358 5.25 17.75 5.25ZM6.5 7.25C6.91421 7.25 7.25 7.58579 7.25 8V16C7.25 16.4142 6.91421 16.75 6.5 16.75C6.08579 16.75 5.75 16.4142 5.75 16V8C5.75 7.58579 6.08579 7.25 6.5 7.25ZM14 7.25C14.4142 7.25 14.75 7.58579 14.75 8V16C14.75 16.4142 14.4142 16.75 14 16.75C13.5858 16.75 13.25 16.4142 13.25 16V8C13.25 7.58579 13.5858 7.25 14 7.25ZM2.75 10.25C3.16421 10.25 3.5 10.5858 3.5 11V13C3.5 13.4142 3.16421 13.75 2.75 13.75C2.33579 13.75 2 13.4142 2 13V11C2 10.5858 2.33579 10.25 2.75 10.25ZM21.25 10.25C21.6642 10.25 22 10.5858 22 11V13C22 13.4142 21.6642 13.75 21.25 13.75C20.8358 13.75 20.5 13.4142 20.5 13V11C20.5 10.5858 20.8358 10.25 21.25 10.25Z"/>
    </svg>
  ),
}

export type ProcessIconType = keyof typeof ICONS

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

// ── ProcessNode ────────────────────────────────────────────────────────────────

export interface ProcessNodeData {
  label: string
  subLabel: string
  accent: string
  icon: ProcessIconType
  [key: string]: unknown
}

export function ProcessNode({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const nodeData = data as ProcessNodeData
  const { label, subLabel, accent, icon } = nodeData

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 148,
        background: '#0F1117',
        border: `1px solid ${selected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        boxShadow: selected
          ? `0 0 0 1px ${accent}33, 0 4px 24px rgba(0,0,0,0.6)`
          : '0 2px 16px rgba(0,0,0,0.5)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 10, padding: '12px 10px 12px 12px',
      }}>
        {/* Colored icon badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${accent}1A`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>
          {ICONS[icon] ?? ICONS.input}
        </div>

        {/* Labels */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary, #E6EAF2)',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 9, fontWeight: 500,
            color: 'var(--text-tertiary, #7D879A)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}>
            {subLabel}
          </div>
        </div>

        {/* Plus button */}
        <PlusButton visible={hovered} />
      </div>

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: `radial-gradient(circle at center, #fff 38%, ${accent} 38%)`,
          border: `1.5px solid ${accent}`,
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
          background: `radial-gradient(circle at center, #fff 38%, ${accent} 38%)`,
          border: `1.5px solid ${accent}`,
          right: -5,
          transition: 'transform 0.15s ease, opacity 0.15s',
        }}
      />
    </div>
  )
}
