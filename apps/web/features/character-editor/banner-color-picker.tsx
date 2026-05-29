'use client'
import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { cn } from '@/lib/utils'

const RECOMMENDED = ['#8b5cf6', '#22d3ee', '#4ade80', '#ED3E3E', '#f472b6', '#fb923c', '#facc15', '#818cf8']

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="currentColor"
      />
    </svg>
  )
}

interface BannerColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function BannerColorPicker({ value, onChange }: BannerColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value.replace('#', ''))
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHexInput(value.replace('#', ''))
  }, [value])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const applyHex = (raw: string) => {
    const clean = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
    setHexInput(clean)
    if (clean.length === 6) onChange(`#${clean}`)
  }

  return (
    <div className="relative inline-block" ref={rootRef}>
      {/* Swatch button */}
      <button
        type="button"
        className="group w-[72px] h-[72px] rounded-xl border border-white/10 cursor-pointer p-0 relative overflow-hidden transition-[border-color,box-shadow] duration-150 shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:border-white/25 hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        style={{ background: value }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose banner color"
      >
        <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white/85 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <PencilIcon />
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+10px)] left-0 z-[200] w-60 bg-[#181C23] border border-[#272C33] rounded-[14px] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.7)] flex flex-col gap-[0.875rem]">
          {/* react-colorful — override styles applied via globals.css .banner-color-picker */}
          <div className="banner-color-picker">
            <HexColorPicker color={value} onChange={onChange} />
          </div>

          {/* Hex input row */}
          <div className="flex items-center gap-[0.375rem] bg-[#12161C] border border-[#2A2E32] rounded-[8px] px-3 py-[0.45rem] transition-[border-color] duration-150 focus-within:border-[rgba(237,62,62,0.5)] focus-within:shadow-[0_0_0_2px_rgba(237,62,62,0.08)]">
            <span className="font-mono text-body text-(--text-muted) select-none">#</span>
            <input
              className="flex-1 bg-transparent border-none outline-none font-mono text-body text-(--text-primary) tracking-[0.06em] uppercase"
              value={hexInput}
              onChange={(e) => applyHex(e.target.value)}
              spellCheck={false}
              maxLength={6}
            />
          </div>

          {/* Swatches */}
          <div className="flex flex-wrap gap-2">
            {RECOMMENDED.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'w-7 h-7 rounded-[6px] border-2 cursor-pointer p-0 transition-[transform,border-color] duration-[120ms] shadow-[0_2px_6px_rgba(0,0,0,0.4)] hover:scale-[1.15]',
                  value.toLowerCase() === c.toLowerCase() ? 'border-white scale-[1.15]' : 'border-transparent',
                )}
                style={{ background: c }}
                onClick={() => {
                  onChange(c)
                  setHexInput(c.slice(1))
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
