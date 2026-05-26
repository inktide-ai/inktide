'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useState } from 'react'

const ACCENT = '#22C55E'

const IcOutput = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.0801 2.12995C13.0655 1.36461 14.5 2.06679 14.5 3.31452L14.5 20.6856C14.4997 21.894 13.1537 22.5906 12.1738 21.9376L12.0801 21.8702L6.80762 17.7755C6.42387 17.4774 5.96272 17.2989 5.48145 17.2589L5.27441 17.2501H4.5L4.24414 17.2374C3.06791 17.1178 2.13253 16.1821 2.0127 15.0059L2 14.7501L2 9.25007C2 7.95575 2.98364 6.89092 4.24414 6.76276L4.5 6.75007L5.27441 6.75007L5.48145 6.74128C5.89394 6.70695 6.29183 6.57068 6.63867 6.34479L6.80762 6.22468L12.0801 2.12995ZM7.72754 7.40925C7.02594 7.95402 6.16268 8.24999 5.27441 8.25007H4.5C3.94771 8.25007 3.5 8.69778 3.5 9.25007L3.5 14.7501C3.50032 15.3021 3.94791 15.7501 4.5 15.7501H5.27441C6.16283 15.7501 7.02588 16.0459 7.72754 16.5909L13 20.6856L13 3.31452L7.72754 7.40925ZM19.8896 7.09284C20.2528 6.89373 20.7081 7.02656 20.9072 7.38971C21.7485 8.92426 22.8634 12.9055 20.9297 17.0665C20.7549 17.4415 20.3089 17.6041 19.9336 17.4298C19.5584 17.2551 19.3961 16.8091 19.5703 16.4337C21.2582 12.8012 20.2607 9.32878 19.5928 8.11042C19.3937 7.74729 19.5266 7.29204 19.8896 7.09284ZM16.8037 9.14753C17.1366 8.90115 17.6061 8.97103 17.8525 9.30378C18.5466 10.2417 19.4522 12.6514 17.8857 15.1485C17.6656 15.499 17.2023 15.6055 16.8516 15.3858C16.5009 15.1658 16.3946 14.7024 16.6143 14.3516C17.7637 12.5194 17.0852 10.7882 16.6475 10.1964C16.4011 9.86356 16.4711 9.39404 16.8037 9.14753Z"/>
  </svg>
)

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
      transition: 'opacity 0.15s',
    }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M4 1v6M1 4h6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export function OutputNode({ selected }: NodeProps) {
  const [hovered, setHovered] = useState(false)

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
          ? `0 0 0 1px ${ACCENT}33, 0 4px 24px rgba(0,0,0,0.6)`
          : '0 2px 16px rgba(0,0,0,0.5)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 10, padding: '12px 10px 12px 12px',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${ACCENT}1A`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: ACCENT,
        }}>
          <IcOutput />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--text-primary, #E6EAF2)',
            letterSpacing: '-0.01em',
          }}>
            Output
          </div>
          <div style={{
            fontSize: 9, fontWeight: 500,
            color: 'var(--text-tertiary, #7D879A)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginTop: 2,
          }}>
            output
          </div>
        </div>

        <PlusButton visible={hovered} />
      </div>

      {/* Input handle only — terminal node */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: 10, height: 10, borderRadius: '50%',
          background: `radial-gradient(circle at center, #fff 38%, ${ACCENT} 38%)`,
          border: `1.5px solid ${ACCENT}`,
          left: -5,
          transition: 'transform 0.15s ease, opacity 0.15s',
        }}
      />
    </div>
  )
}
