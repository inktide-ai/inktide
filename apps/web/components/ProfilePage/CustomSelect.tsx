'use client'
import { useRef, useEffect, useState } from 'react'
import styles from './ProfilePage.module.css'

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
    <div
      ref={containerRef}
      className={`${styles.customSelect} ${open ? styles.customSelectOpen : ''} ${disabled ? styles.customSelectDisabled : ''} ${className}`}
    >
      <button
        type="button"
        className={styles.customSelectTrigger}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className={styles.customSelectValue}>{selected.label}</span>
        <svg
          className={styles.customSelectChevron}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={styles.customSelectDropdown}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.customSelectOption} ${opt.value === value ? styles.customSelectOptionSelected : ''}`}
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
