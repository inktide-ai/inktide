import { useEffect, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import styles from './BannerColorPicker.module.css'

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
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.swatch}
        style={{ background: value }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Choose banner color"
      >
        <span className={styles.swatchIcon}>
          <PencilIcon />
        </span>
      </button>

      {open && (
        <div className={styles.popover}>
          <HexColorPicker color={value} onChange={onChange} className={styles.picker} />

          <div className={styles.hexRow}>
            <span className={styles.hash}>#</span>
            <input
              className={styles.hexInput}
              value={hexInput}
              onChange={(e) => applyHex(e.target.value)}
              spellCheck={false}
              maxLength={6}
            />
          </div>

          <div className={styles.swatches}>
            {RECOMMENDED.map((c) => (
              <button
                key={c}
                type="button"
                className={`${styles.chip} ${value.toLowerCase() === c.toLowerCase() ? styles.chipActive : ''}`}
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
