'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, EyeOff, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Node as RFNode } from '@xyflow/react'
import { NODE_DEFINITIONS, type PipelineNodeType } from '../nodes/node-definitions'
import type { PipelineNodeData } from '../nodes/pipeline-node'
import { LLM_PROVIDER_CATALOG, type LlmProviderCatalogEntry } from '@/data/llm-providers'

// ── Icons ─────────────────────────────────────────────────────────────────────

const IcArrowIn = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M10.25 2.9996C10.6641 2.9996 10.9998 3.33557 11 3.7496C11 4.16382 10.6642 4.4996 10.25 4.4996H5.25C4.83592 4.4996 4.50021 4.83557 4.5 5.2496V18.7496C4.5 19.1638 4.83579 19.4996 5.25 19.4996H18.75C19.1642 19.4996 19.5 19.1638 19.5 18.7496V13.7496C19.5002 13.3356 19.8359 12.9996 20.25 12.9996C20.6641 12.9996 20.9998 13.3356 21 13.7496V18.7496C21 19.9922 19.9926 20.9996 18.75 20.9996H5.25C4.00736 20.9996 3 19.9922 3 18.7496V5.2496C3.00021 4.00714 4.00749 2.9996 5.25 2.9996H10.25ZM19.7197 3.21933C20.0126 2.92685 20.4875 2.92678 20.7803 3.21933C21.073 3.51219 21.0729 3.98705 20.7803 4.27988L16.0576 8.9996H19.25C19.6641 8.9996 19.9998 9.33557 20 9.7496C20 10.1638 19.6642 10.4996 19.25 10.4996H14.25C14.0756 10.4996 13.9174 10.4374 13.79 10.3375C13.7808 10.3303 13.7717 10.3228 13.7627 10.315C13.7341 10.2904 13.7072 10.2646 13.6826 10.2359C13.6741 10.2261 13.6661 10.2158 13.6582 10.2057C13.5606 10.079 13.5 9.92186 13.5 9.7496V4.7496C13.5002 4.33557 13.8359 3.9996 14.25 3.9996C14.6641 3.9996 14.9998 4.33557 15 4.7496V7.93515L19.7197 3.21933Z" fill="currentColor"/>
  </svg>
)
const IcThinking = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 11.5858 2.33579 11.25 2.75 11.25C3.16421 11.25 3.5 11.5858 3.5 12C3.5 16.6944 7.30558 20.5 12 20.5C16.6944 20.5 20.5 16.6944 20.5 12C20.5 7.30558 16.6944 3.5 12 3.5C11.5858 3.5 11.25 3.16421 11.25 2.75C11.25 2.33579 11.5858 2 12 2ZM12 6.4502C12.4142 6.4502 12.75 6.78598 12.75 7.2002V11.5361L15.9355 13.1289C16.306 13.3142 16.4557 13.7653 16.2705 14.1357C16.0851 14.5059 15.635 14.6558 15.2646 14.4707L11.665 12.6709C11.411 12.5439 11.2501 12.284 11.25 12V7.2002C11.25 6.78598 11.5858 6.4502 12 6.4502ZM3.375 7.7793C3.85821 7.7793 4.24993 8.1711 4.25 8.6543C4.25 9.13755 3.85825 9.5293 3.375 9.5293C2.89175 9.5293 2.5 9.13755 2.5 8.6543C2.50007 8.1711 2.89179 7.7793 3.375 7.7793ZM5.47852 4.60352C5.96154 4.60378 6.35352 4.99543 6.35352 5.47852C6.35325 5.96138 5.96138 6.35325 5.47852 6.35352C4.99543 6.35352 4.60378 5.96154 4.60352 5.47852C4.60352 4.99527 4.99527 4.60352 5.47852 4.60352ZM8.625 2.5C9.10825 2.5 9.5 2.89175 9.5 3.375C9.5 3.85825 9.10825 4.25 8.625 4.25C8.14175 4.25 7.75 3.85825 7.75 3.375C7.75 2.89175 8.14175 2.5 8.625 2.5Z" fill="currentColor"/>
  </svg>
)
const IcSpeaker = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.0801 2.12995C13.0655 1.36461 14.5 2.06679 14.5 3.31452L14.5 20.6856C14.4997 21.894 13.1537 22.5906 12.1738 21.9376L12.0801 21.8702L6.80762 17.7755C6.42387 17.4774 5.96272 17.2989 5.48145 17.2589L5.27441 17.2501H4.5L4.24414 17.2374C3.06791 17.1178 2.13253 16.1821 2.0127 15.0059L2 14.7501L2 9.25007C2 7.95575 2.98364 6.89092 4.24414 6.76276L4.5 6.75007L5.27441 6.75007L5.48145 6.74128C5.89394 6.70695 6.29183 6.57068 6.63867 6.34479L6.80762 6.22468L12.0801 2.12995ZM7.72754 7.40925C7.02594 7.95402 6.16268 8.24999 5.27441 8.25007H4.5C3.94771 8.25007 3.5 8.69778 3.5 9.25007L3.5 14.7501C3.50032 15.3021 3.94791 15.7501 4.5 15.7501H5.27441C6.16283 15.7501 7.02588 16.0459 7.72754 16.5909L13 20.6856L13 3.31452L7.72754 7.40925ZM19.8896 7.09284C20.2528 6.89373 20.7081 7.02656 20.9072 7.38971C21.7485 8.92426 22.8634 12.9055 20.9297 17.0665C20.7549 17.4415 20.3089 17.6041 19.9336 17.4298C19.5584 17.2551 19.3961 16.8091 19.5703 16.4337C21.2582 12.8012 20.2607 9.32878 19.5928 8.11042C19.3937 7.74729 19.5266 7.29204 19.8896 7.09284ZM16.8037 9.14753C17.1366 8.90115 17.6061 8.97103 17.8525 9.30378C18.5466 10.2417 19.4522 12.6514 17.8857 15.1485C17.6656 15.499 17.2023 15.6055 16.8516 15.3858C16.5009 15.1658 16.3946 14.7024 16.6143 14.3516C17.7637 12.5194 17.0852 10.7882 16.6475 10.1964C16.4011 9.86356 16.4711 9.39404 16.8037 9.14753Z" fill="currentColor"/>
  </svg>
)
const IcArrowOut = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M10.25 3C10.6642 3 11 3.33579 11 3.75C11 4.16421 10.6642 4.5 10.25 4.5H5.25C4.83579 4.5 4.5 4.83579 4.5 5.25V18.75C4.5 19.1642 4.83579 19.5 5.25 19.5H18.75C19.1642 19.5 19.5 19.1642 19.5 18.75V13.75C19.5 13.3358 19.8358 13 20.25 13C20.6642 13 21 13.3358 21 13.75V18.75C21 19.9926 19.9926 21 18.75 21H5.25C4.00736 21 3 19.9926 3 18.75V5.25C3 4.00736 4.00736 3 5.25 3H10.25ZM20.25 3C20.6642 3 21 3.33579 21 3.75V8.75C21 9.16421 20.6642 9.5 20.25 9.5C19.8358 9.5 19.5 9.16421 19.5 8.75V5.54883L14.7803 10.2764C14.4876 10.569 14.0127 10.5689 13.7197 10.2764C13.427 9.98367 13.4272 9.5088 13.7197 9.21582L18.4277 4.5H15.25C14.8358 4.5 14.5 4.16421 14.5 3.75C14.5 3.33579 14.8358 3 15.25 3H20.25Z" fill="currentColor"/>
  </svg>
)
const IcLightning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12.25 10.25L14.0352 4.41843C14.4406 3.09414 12.7114 2.19134 11.8565 3.28093L5.15342 11.8241C4.38109 12.8084 5.08236 14.25 6.33353 14.25H11.75L10.0219 19.6646C9.60158 20.9817 11.3144 21.9057 12.1843 20.8311L18.7717 12.6938C19.5656 11.7131 18.8676 10.25 17.6058 10.25H12.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)
const IcMemory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 3C16.8325 3 20.75 6.91751 20.75 11.75C20.75 16.5825 16.8325 20.5 12 20.5H6.11621L6.72461 21.1084C7.01747 21.4013 7.0174 21.876 6.72461 22.1689C6.43172 22.4618 5.95696 22.4618 5.66406 22.1689L3.71973 20.2246C3.42695 19.9317 3.42687 19.4569 3.71973 19.1641L5.66406 17.2197C5.95692 16.9269 6.43171 16.9269 6.72461 17.2197C7.0175 17.5126 7.0175 17.9874 6.72461 18.2803L6.00488 19H12C16.0041 19 19.25 15.7541 19.25 11.75C19.25 7.74594 16.0041 4.5 12 4.5C7.99594 4.5 4.75 7.74594 4.75 11.75V12C4.75 12.4142 4.41421 12.75 4 12.75C3.58579 12.75 3.25 12.4142 3.25 12V11.75C3.25 6.91751 7.16751 3 12 3ZM15.8105 10.9551C15.9735 10.5743 16.4142 10.3977 16.7949 10.5605C17.1757 10.7235 17.3523 11.1642 17.1895 11.5449C16.7471 12.5783 15.884 13.4999 14.7002 13.5C13.9702 13.5 13.3621 13.1496 12.8994 12.6387C12.4368 13.1492 11.8293 13.5 11.0996 13.5C10.3699 13.4999 9.76238 13.1494 9.2998 12.6387C8.83717 13.1494 8.22978 13.5 7.5 13.5C7.08579 13.5 6.75 13.1642 6.75 12.75C6.75 12.3358 7.08579 12 7.5 12C7.81873 12 8.27875 11.7297 8.61035 10.9551C8.72843 10.6792 8.99973 10.5001 9.2998 10.5C9.59996 10.5 9.87115 10.6791 9.98926 10.9551C10.3207 11.7295 10.7809 11.9998 11.0996 12C11.4184 12 11.8793 11.7298 12.2109 10.9551L12.2617 10.8564C12.3968 10.6372 12.6377 10.5 12.9004 10.5C13.2004 10.5002 13.4718 10.6793 13.5898 10.9551C13.9214 11.7296 14.3815 12 14.7002 12C15.0189 11.9999 15.479 11.7296 15.8105 10.9551Z" fill="currentColor"/>
  </svg>
)
const IcFilter = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M9.25 15.5C9.66421 15.5 10 15.8358 10 16.25V17H20.25C20.6642 17 21 17.3358 21 17.75C21 18.1642 20.6642 18.5 20.25 18.5H10V19.25C10 19.6642 9.66421 20 9.25 20C8.83579 20 8.5 19.6642 8.5 19.25V16.25C8.5 15.8358 8.83579 15.5 9.25 15.5ZM5.75 17C6.16421 17 6.5 17.3358 6.5 17.75C6.5 18.1642 6.16421 18.5 5.75 18.5H3.75C3.33579 18.5 3 18.1642 3 17.75C3 17.3358 3.33579 17 3.75 17H5.75ZM17 9.75C17.4142 9.75 17.75 10.0858 17.75 10.5V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H17.75V13.5C17.75 13.9142 17.4142 14.25 17 14.25C16.5858 14.25 16.25 13.9142 16.25 13.5V10.5C16.25 10.0858 16.5858 9.75 17 9.75ZM13.25 11.25C13.6642 11.25 14 11.5858 14 12C14 12.4142 13.6642 12.75 13.25 12.75H3.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25H13.25ZM12 4C12.4142 4 12.75 4.33579 12.75 4.75V5.5H20.25C20.6642 5.5 21 5.83579 21 6.25C21 6.66421 20.6642 7 20.25 7H12.75V7.75C12.75 8.16421 12.4142 8.5 12 8.5C11.5858 8.5 11.25 8.16421 11.25 7.75V4.75C11.25 4.33579 11.5858 4 12 4ZM8.25 5.5C8.66421 5.5 9 5.83579 9 6.25C9 6.66421 8.66421 7 8.25 7H3.75C3.33579 7 3 6.66421 3 6.25C3 5.83579 3.33579 5.5 3.75 5.5H8.25Z" fill="currentColor"/>
  </svg>
)

const NODE_ICONS: Record<PipelineNodeType, React.ReactNode> = {
  input:           <IcArrowIn />,
  context_builder: <IcFilter />,
  discord:         <IcArrowIn />,
  twitch:          <IcArrowIn />,
  telegram:        <IcArrowIn />,
  llm:             <IcThinking />,
  tts:             <IcSpeaker />,
  output:          <IcArrowOut />,
  emotion:         <IcLightning />,
  memory:          <IcMemory />,
  filter:          <IcFilter />,
}

// ── Layout constants ──────────────────────────────────────────────────────────
const MIN_WIDTH     = 240
const MAX_WIDTH     = 500
const DEFAULT_WIDTH = 280

// ── Primitives ────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative px-4 py-3 border-b border-[var(--inspector-section-separator)]">
      <h2 className="mb-2 h-6 flex items-center text-[14px] font-medium tracking-[-0.01em] text-[var(--text-secondary)]">
        {title}
      </h2>
      {children}
    </div>
  )
}

const cellBase = 'flex items-center gap-1.5 h-7 px-2 rounded min-w-0 overflow-hidden'
const cellLabel = 'text-[10px] text-[var(--text-tertiary)] shrink-0'
const cellInput = cn(
  'flex-1 min-w-0 bg-transparent border-none outline-none',
  'text-[12px] text-right font-[Inter,var(--font-ui),sans-serif]',
)

function TextCell({ label, value, onChange, readOnly, accent, dark, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void
  readOnly?: boolean; accent?: string; dark?: boolean; placeholder?: string
}) {
  return (
    <div className={cn(
      cellBase,
      dark ? 'bg-[var(--bg-0)] border border-[var(--border-subtle)]' : 'bg-[var(--input-bg)]',
    )}>
      <span className={cellLabel}>{label}</span>
      {accent ? (
        <span className="flex-1 min-w-0 text-[12px] text-right truncate" style={{ color: accent }}>
          {value}
        </span>
      ) : (
        <input
          type="text"
          className={cn(cellInput, 'inspector-text-input', readOnly ? 'text-[var(--text-tertiary)] cursor-default' : 'text-[var(--text-primary)]')}
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={e => onChange?.(e.target.value)}
        />
      )}
    </div>
  )
}

function PasswordCell({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className={cn(cellBase, 'bg-[var(--input-bg)] pr-1.5')}>
      <span className={cellLabel}>{label}</span>
      <input
        type={show ? 'text' : 'password'}
        className={cn(cellInput, 'inspector-text-input', 'text-[var(--text-primary)]')}
        value={value}
        placeholder={placeholder ?? '••••••••••••••••'}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="shrink-0 flex items-center justify-center text-[var(--text-tertiary)] bg-transparent border-none cursor-pointer p-0"
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  )
}

function TextAreaCell({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className={cellLabel}>{label}</span>
      <textarea
        className={cn(
          'inspector-textarea',
          'w-full rounded px-2 py-1.5 text-[12px] leading-relaxed outline-none',
          'bg-[var(--input-bg)] border border-[var(--border-subtle)]',
          'text-[var(--text-primary)] font-[Inter,var(--font-ui),sans-serif]',
        )}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function InputCell({ label, value, onChange, min, max, step = 1, span }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; span?: boolean
}) {
  return (
    <div className={cn(cellBase, 'bg-[var(--input-bg)]', span && 'col-span-2')}>
      <span className={cellLabel}>{label}</span>
      <input
        type="number"
        className={cn('inspector-num-input', cellInput, 'text-[var(--text-primary)]')}
        value={value}
        min={min} max={max} step={step}
        onChange={e => { const n = Number(e.target.value); if (!isNaN(n)) onChange(n) }}
      />
    </div>
  )
}

function InputGrid({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-none m-0 p-0 min-w-0 w-full block">
      <legend className="sr-only">{legend}</legend>
      <div className="grid grid-cols-2 gap-1 w-full">
        {children}
      </div>
    </fieldset>
  )
}

// ── Provider picker ───────────────────────────────────────────────────────────

function ProviderIcon({ id, size = 32 }: { id: string; size?: number }) {
  const entry = LLM_PROVIDER_CATALOG.find(p => p.id === id)
  const iconSrc = entry?.iconSrc ?? '/images/providers/brain/chatgpt.svg'
  const dark = entry?.darkIcon ?? false
  const r = Math.round(size * 0.28)
  return (
    <div
      className={cn('shrink-0 flex items-center justify-center overflow-hidden', dark ? 'bg-white' : 'bg-[#1C1F2A]')}
      style={{ width: size, height: size, borderRadius: r }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} alt={entry?.name ?? id} width={size * 0.68} height={size * 0.68}
        className="object-contain block" />
    </div>
  )
}

function ProviderPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const pillRef  = useRef<HTMLDivElement>(null)
  const flyoutRef = useRef<HTMLDivElement>(null)
  const currentEntry = LLM_PROVIDER_CATALOG.find(p => p.id === value)

  const openFlyout = () => {
    if (!pillRef.current) return
    const r = pillRef.current.getBoundingClientRect()
    setPos({ top: r.top, right: window.innerWidth - r.left + 8 })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        flyoutRef.current && !flyoutRef.current.contains(e.target as Node) &&
        pillRef.current  && !pillRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const providers: LlmProviderCatalogEntry[] = LLM_PROVIDER_CATALOG

  return (
    <>
      {/* Pill */}
      <div
        ref={pillRef}
        className={cn(
          'flex items-center h-7 rounded overflow-hidden transition-[border-color] duration-150',
          'bg-[var(--input-bg)]',
          open ? 'border border-[rgba(99,102,241,0.4)]' : 'border border-[var(--border-subtle)]',
        )}
      >
        <div className="flex items-center gap-1.5 flex-1 px-2 min-w-0">
          <ProviderIcon id={value} size={16} />
          <span className="text-[12px] text-[var(--text-primary)] truncate">
            {currentEntry?.name ?? value}
          </span>
        </div>
        <button
          type="button"
          onClick={openFlyout}
          className={cn(
            'shrink-0 w-6 h-full flex items-center justify-center border-none cursor-pointer',
            'border-l border-l-[var(--border-subtle)] transition-colors duration-100',
            open
              ? 'bg-[rgba(99,102,241,0.12)] text-[#818CF8]'
              : 'bg-transparent text-[var(--text-tertiary)] hover:bg-white/[0.05]',
          )}
        >
          <ChevronRight size={11} />
        </button>
      </div>

      {/* Flyout (portal) */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={flyoutRef}
          className={cn(
            'fixed z-[9999] rounded-[10px] p-2.5 min-w-[192px]',
            'bg-[var(--inspector-bg)] border border-[var(--border-default)]',
            '[box-shadow:0_16px_48px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.4)]',
            'animate-[providerIn_0.14s_cubic-bezier(0.22,1,0.36,1)_both]',
          )}
          style={{ top: pos.top, right: pos.right }}
        >
          <p className="mx-0.5 mb-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Model provider
          </p>
          <div className="grid grid-cols-5 gap-0.5 max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
            {providers.map(p => {
              const selected = p.id === value
              return (
                <button
                  key={p.id}
                  type="button"
                  title={p.name}
                  onClick={() => { onChange(p.id); setOpen(false) }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-1.5 rounded-md border-none cursor-pointer transition-colors duration-[80ms]',
                    selected
                      ? 'bg-[rgba(99,102,241,0.12)] outline outline-1 outline-[rgba(99,102,241,0.5)]'
                      : 'bg-transparent hover:bg-white/[0.06]',
                  )}
                >
                  <ProviderIcon id={p.id} size={36} />
                  <span className={cn(
                    'text-[9px] text-center max-w-[48px] truncate tracking-[-0.01em] leading-tight',
                    selected ? 'text-[#A5B4FC]' : 'text-[var(--text-tertiary)]',
                  )}>
                    {p.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

// ── LLM config ────────────────────────────────────────────────────────────────

interface LlmCfg {
  provider_id:      string
  base_url:         string
  api_key:          string
  model_id:         string
  system_prompt:    string
  temperature:      number
  max_tokens:       number
  top_p:            number
  freq_penalty:     number
  presence_penalty: number
}


function defaultLlmCfg(nodeData: PipelineNodeData): LlmCfg {
  const d = nodeData as Record<string, unknown>
  return {
    provider_id:      (d.provider_id      as string)  ?? 'ollama',
    base_url:         (d.base_url         as string)  ?? 'http://localhost:11434',
    api_key:          (d.api_key          as string)  ?? '',
    model_id:         (d.model_id         as string)  ?? '',
    system_prompt:    (d.system_prompt    as string)  ?? '',
    temperature:      (d.temperature      as number)  ?? 0.7,
    max_tokens:       (d.max_tokens       as number)  ?? 512,
    top_p:            (d.top_p            as number)  ?? 1.0,
    freq_penalty:     (d.freq_penalty     as number)  ?? 0.0,
    presence_penalty: (d.presence_penalty as number)  ?? 0.0,
  }
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface Props {
  node: RFNode
  onClose: () => void
  onNameChange: (nodeId: string, name: string) => void
  onNodeDataChange?: (nodeId: string, patch: Record<string, unknown>) => void
}

export default function NodeInspectorPanel({ node, onClose, onNameChange, onNodeDataChange }: Props) {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const nodeData = node.data as PipelineNodeData
  const def = NODE_DEFINITIONS[nodeData.pipelineType]
  if (!def) return null   // new node types (process, source, agentContext, outputNode) have no pipeline config
  const name = (nodeData.name as string | undefined) ?? def.label

  const [llmCfg, setLlmCfg] = useState<LlmCfg>(() => defaultLlmCfg(nodeData))

  // Re-initialize when a different node is selected
  useEffect(() => {
    if (nodeData.pipelineType === 'llm')
      setLlmCfg(defaultLlmCfg(nodeData))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id])

  // Propagate LLM config changes back to node data
  useEffect(() => {
    if (nodeData.pipelineType !== 'llm') return
    onNodeDataChange?.(node.id, llmCfg as unknown as Record<string, unknown>)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [llmCfg])

  const set = useCallback(<K extends keyof LlmCfg>(key: K, val: LlmCfg[K]) => {
    setLlmCfg(c => ({ ...c, [key]: val }))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = panelWidth
    const onMove = (mv: MouseEvent) => {
      const delta = startX - mv.clientX
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + delta)))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [panelWidth])

  const isOllama = llmCfg.provider_id === 'ollama'

  return (
    <div
      className={cn('flex-shrink-0 flex flex-col h-full relative bg-[var(--inspector-bg)] border-l border-[var(--border-subtle)] animate-[inspectorIn_0.2s_cubic-bezier(0.22,1,0.36,1)_both]')}
      style={{ width: panelWidth }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 hover:bg-white/[0.08] transition-colors"
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 flex-shrink-0 h-10 pl-3 pr-2 border-b border-[var(--border-subtle)]"
      >
        <span className="flex items-center justify-center shrink-0 text-[#8E8B86]">
          {NODE_ICONS[nodeData.pipelineType]}
        </span>
        <span className="flex-1 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
          {def.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent"
          title="Close (Esc)"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto text-[12px] text-[var(--text-primary)]">

        {/* Basic — all nodes */}
        <Section title="Basic">
          <div className="flex flex-col gap-1">
            <InputGrid legend="Name and ID">
              <TextCell label="Name" value={name} onChange={v => onNameChange(node.id, v)} />
              <TextCell label="ID" value={node.id} readOnly />
            </InputGrid>
            <TextCell label="Type" value={def.label} dark readOnly />
          </div>
        </Section>

        {/* Model — LLM only */}
        {nodeData.pipelineType === 'llm' && (
          <>
            <Section title="Model">
              <div className="flex flex-col gap-1">

                {/* Provider */}
                <ProviderPicker
                  value={llmCfg.provider_id}
                  onChange={v => set('provider_id', v)}
                />

                {/* Ollama: Base URL */}
                {isOllama && (
                  <TextCell
                    label="Base URL"
                    value={llmCfg.base_url}
                    placeholder="http://localhost:11434"
                    onChange={v => set('base_url', v)}
                  />
                )}

                {/* Remote: API Key */}
                {!isOllama && (
                  <PasswordCell
                    label="API Key"
                    value={llmCfg.api_key}
                    onChange={v => set('api_key', v)}
                  />
                )}

                {/* Model ID */}
                <TextCell
                  label="Model"
                  value={llmCfg.model_id}
                  placeholder={isOllama ? 'llama3.2' : 'gpt-4o'}
                  onChange={v => set('model_id', v)}
                />

                {/* System Prompt */}
                <TextAreaCell
                  label="System prompt"
                  value={llmCfg.system_prompt}
                  placeholder="Override the character system prompt…"
                  onChange={v => set('system_prompt', v)}
                  rows={3}
                />

              </div>
            </Section>

            <Section title="Parameters">
              <InputGrid legend="LLM parameters">
                <InputCell
                  label="Temp"
                  value={llmCfg.temperature}
                  min={0} max={2} step={0.05}
                  onChange={v => set('temperature', Math.min(2, Math.max(0, v)))}
                />
                <InputCell
                  label="Max tokens"
                  value={llmCfg.max_tokens}
                  min={64} max={4096} step={64}
                  onChange={v => set('max_tokens', Math.min(4096, Math.max(64, v)))}
                />
                <InputCell
                  label="Top P"
                  value={llmCfg.top_p}
                  min={0} max={1} step={0.05}
                  onChange={v => set('top_p', Math.min(1, Math.max(0, v)))}
                />
                <InputCell
                  label="Freq penalty"
                  value={llmCfg.freq_penalty}
                  min={0} max={2} step={0.05}
                  onChange={v => set('freq_penalty', Math.min(2, Math.max(0, v)))}
                />
                <InputCell
                  label="Presence penalty"
                  value={llmCfg.presence_penalty}
                  min={0} max={2} step={0.05}
                  span
                  onChange={v => set('presence_penalty', Math.min(2, Math.max(0, v)))}
                />
              </InputGrid>
            </Section>
          </>
        )}

      </div>
    </div>
  )
}
