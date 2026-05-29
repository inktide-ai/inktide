'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ChatMode = 'floating' | 'sidebar' | 'fullscreen'

interface ChatModeMenuProps {
  open: boolean
  mode: ChatMode
  onSelect: (mode: ChatMode) => void
  onClose: () => void
}

const PeekSideIcon = () => (
  <svg viewBox="0 0 20 20" width={16} height={16} fill="currentColor" aria-hidden>
    <path d="M10.392 6.125a.5.5 0 0 0-.5.5v6.75a.5.5 0 0 0 .5.5h4.683a.5.5 0 0 0 .5-.5v-6.75a.5.5 0 0 0-.5-.5z" />
    <path d="M4.5 4.125A2.125 2.125 0 0 0 2.375 6.25v7.5c0 1.174.951 2.125 2.125 2.125h11a2.125 2.125 0 0 0 2.125-2.125v-7.5A2.125 2.125 0 0 0 15.5 4.125zM3.625 6.25c0-.483.392-.875.875-.875h11c.483 0 .875.392.875.875v7.5a.875.875 0 0 1-.875.875h-11a.875.875 0 0 1-.875-.875z" />
  </svg>
)

const PeekCornerIcon = () => (
  <svg viewBox="0 0 20 20" width={16} height={16} fill="currentColor" aria-hidden>
    <path d="M11.93 9.125a.5.5 0 0 0-.5.5v3.75a.5.5 0 0 0 .5.5h3.145a.5.5 0 0 0 .5-.5v-3.75a.5.5 0 0 0-.5-.5z" />
    <path d="M4.5 4.125A2.125 2.125 0 0 0 2.375 6.25v7.5c0 1.174.951 2.125 2.125 2.125h11a2.125 2.125 0 0 0 2.125-2.125v-7.5A2.125 2.125 0 0 0 15.5 4.125zM3.625 6.25c0-.483.392-.875.875-.875h11c.483 0 .875.392.875.875v7.5a.875.875 0 0 1-.875.875h-11a.875.875 0 0 1-.875-.875z" />
  </svg>
)

const PeekFullIcon = () => (
  <svg viewBox="0 0 20 20" width={16} height={16} fill="currentColor" aria-hidden>
    <path d="M4.93 6.125a.5.5 0 0 0-.5.5v6.75a.5.5 0 0 0 .5.5h10.145a.5.5 0 0 0 .5-.5v-6.75a.5.5 0 0 0-.5-.5z" />
    <path d="M4.5 4.125A2.125 2.125 0 0 0 2.375 6.25v7.5c0 1.174.951 2.125 2.125 2.125h11a2.125 2.125 0 0 0 2.125-2.125v-7.5A2.125 2.125 0 0 0 15.5 4.125zM3.625 6.25c0-.483.392-.875.875-.875h11c.483 0 .875.392.875.875v7.5a.875.875 0 0 1-.875.875h-11a.875.875 0 0 1-.875-.875z" />
  </svg>
)

const CheckmarkIcon = () => (
  <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden>
    <path d="M11.834 3.309a.625.625 0 0 1 1.072.642l-5.244 8.74a.625.625 0 0 1-1.01.085L3.155 8.699a.626.626 0 0 1 .95-.813l2.93 3.419z" />
  </svg>
)

const ITEMS: Array<{ mode: ChatMode; label: string; Icon: () => JSX.Element }> = [
  { mode: 'sidebar',     label: 'Sidebar',      Icon: PeekSideIcon },
  { mode: 'floating',    label: 'Floating',     Icon: PeekCornerIcon },
  { mode: 'fullscreen',  label: 'Full screen',  Icon: PeekFullIcon },
]

export function ChatModeMenu({ open, mode, onSelect, onClose }: ChatModeMenuProps) {
  useEffect(() => {
    if (!open) return
    const handler = () => { onClose() }
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            right: 0,
            transformOrigin: '50% bottom',
            background: 'var(--menu-panel-bg)',
            boxShadow: 'var(--menu-panel-shadow)',
            borderRadius: 12,
            minWidth: 190,
            overflow: 'hidden',
            zIndex: 100,
          }}
          initial={{ scale: 0.9, opacity: 0, y: 4 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 4 }}
          transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          onMouseDown={e => e.stopPropagation()}
          role="menu"
          aria-label="Chat display mode"
        >
          <div style={{ padding: '4px 0' }}>
            {ITEMS.map(({ mode: m, label, Icon }) => {
              const isActive = m === mode
              return (
                <button
                  key={m}
                  type="button"
                  role="menuitem"
                  onClick={() => onSelect(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '7px 12px',
                    background: isActive ? 'var(--surface-2)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    textAlign: 'left',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isActive ? 'var(--surface-2)' : 'transparent' }}
                >
                  <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <Icon />
                  </span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && (
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                      <CheckmarkIcon />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
