'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Slider } from '@/shared/ui/slider'
import { MicIcon } from './voice-icons'


export const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3',
  'text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]',
  'transition-colors focus:border-[var(--border-default)]',
)


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
        <p className="text-body font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-xs leading-snug text-[var(--text-tertiary)]">{desc}</p>
      </div>
      <Slider
        value={value} onChange={onChange}
        min={min} max={max} step={step}
        fill="var(--text-primary)" trackHeight={4} thumbSize={14}
        className="flex-1"
      />
      <span className="w-[4.5rem] shrink-0 text-center text-sm text-[var(--text-primary)]">
        {format ? format(value) : value.toFixed(decimals)}
      </span>
    </div>
  )
}


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
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
        <MicIcon />
        {label}
      </div>
      {hint && <p className="mb-3 text-xs text-[var(--text-tertiary)]">{hint}</p>}
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


export function GlobalParamRow({ name, desc, min, max, step, value, onChange, decimals }: {
  name: string; desc: string; min: number; max: number; step: number
  value: number; onChange: (v: number) => void; decimals: number
}) {

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-body text-[var(--text-secondary)]">{desc}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3 ml-8">
        <Slider
          value={value} onChange={onChange}
          min={min} max={max} step={step}
          fill="var(--text-primary)" trackHeight={4} thumbSize={14}
          className="w-36"
        />
        <input
          type="number"
          min={min} max={max} step={step}
          value={value.toFixed(decimals)}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
          }}
          className="w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] py-1 text-center text-body text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--border-default)] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  )
}


export function GlobalToggleRow({ name, desc, value, onChange }: {
  name: string; desc: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-[var(--text-primary)]">{name}</p>
        <p className="mt-0.5 text-body text-[var(--text-secondary)]">{desc}</p>
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
