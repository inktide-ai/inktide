'use client'
import { useRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const CustomSelect = ({
  value,
  options,
  onChange,
  disabled = false,
  className = '',
}: CustomSelectProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        className={cn(
          'w-full flex items-center justify-between gap-2 px-[0.875rem] py-[0.625rem] bg-transparent border border-(--border) rounded-lg text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] cursor-pointer transition-[border-color,background] duration-200 ease outline-none text-left',
          'hover:enabled:border-white/35',
          open && 'border-white/35',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className="flex-1 min-w-0">{selected.label}</span>
        <svg
          className={cn('shrink-0 text-(--text-muted) transition-transform duration-200 ease', open && 'rotate-180')}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-[100] bg-(--bg-surface) border border-white/10 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.08)] overflow-hidden animate-[menuIn_0.15s_ease]">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                'w-full px-[0.875rem] py-[0.625rem] bg-none border-none text-(--text-primary) font-[var(--font-ui)] text-[0.8125rem] text-left cursor-pointer transition-[background] duration-150 ease',
                'hover:bg-white/[0.06]',
                opt.value === value
                  ? 'bg-[rgba(237,62,62,0.12)] text-(--accent-red-bright) hover:bg-[rgba(237,62,62,0.18)]'
                  : '',
              )}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
