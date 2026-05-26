'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MicIcon } from './voice-icons'

// ── Shared input class ────────────────────────────────────────────────────────

export const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3',
  'text-[0.8125rem] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]',
  'transition-colors focus:border-[var(--border-default)]',
)

// ── ParamRow — provider-specific slider row ───────────────────────────────────

interface ParamRowProps {
  icon: ReactNode
  name: string
  desc: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  decimals: number
  format?: (v: number) => string
}

export function ParamRow({ icon, name, desc, min, max, step, value, onChange, decimals, format }: ParamRowProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <span className="w-5 shrink-0">{icon}</span>
      <div className="w-52 shrink-0">
        <p className="text-[0.875rem] font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-[0.75rem] leading-snug text-[var(--text-tertiary)]">{desc}</p>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] outline-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--text-primary)]"
        style={{ background: `linear-gradient(to right, var(--text-primary) ${((value - min) / (max - min)) * 100}%, var(--border-subtle) ${((value - min) / (max - min)) * 100}%)` }}
      />
      <span className="w-[4.5rem] shrink-0 text-center text-[0.8125rem] text-[var(--text-primary)]">
        {format ? format(value) : value.toFixed(decimals)}
      </span>
    </div>
  )
}

// ── SelectField — provider-specific dropdown ──────────────────────────────────

export function SelectField({
  label,
  hint,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string
  hint?: string
  value: string
  disabled?: boolean
  onChange: (v: string) => void
  children: ReactNode
}) {
  return (
    <div className="p-5">
      <div className="mb-2 flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--text-primary)]">
        <MicIcon />
        {label}
      </div>
      {hint && <p className="mb-3 text-[0.75rem] text-[var(--text-tertiary)]">{hint}</p>}
      <div className="relative">
        <select
          className={cn(inputCls, 'appearance-none cursor-pointer pr-8')}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {children}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-tertiary)]" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

// ── GlobalParamRow — main page slider row (compact) ───────────────────────────

export function GlobalParamRow({ name, desc, min, max, step, value, onChange, decimals }: {
  name: string; desc: string; min: number; max: number; step: number
  value: number; onChange: (v: number) => void; decimals: number
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 ml-8">
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-36 cursor-pointer appearance-none rounded-full outline-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--text-primary)]"
          style={{ height: '4px', background: `linear-gradient(to right, var(--text-primary) ${pct}%, var(--border-subtle) ${pct}%)` }}
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={value.toFixed(decimals)}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] py-1 text-center text-[14px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-default)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}

// ── GlobalToggleRow — main page toggle row ────────────────────────────────────

export function GlobalToggleRow({ name, desc, value, onChange }: {
  name: string; desc: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'h-[18px] w-[30px] shrink-0 rounded-[44px] p-[2px] outline-none ml-8',
          'transition-[background] duration-200',
          value ? 'bg-[var(--text-primary)]' : 'bg-[var(--border-default)]',
        )}
      >
        <span className={cn(
          'block h-[14px] w-[14px] rounded-[44px] bg-white shadow-sm',
          'transition-transform duration-200 ease-out',
          value ? 'translate-x-[12px]' : 'translate-x-0',
        )} />
      </button>
    </div>
  )
}
