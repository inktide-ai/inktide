'use client'

import { useState } from 'react'

export const SECTION_TITLE_SIZE = 12
export const C = {
  sectionTitle:    '#9AA4B2',
  rowLabel:        '#6B7280',
  valueText:       '#E6EAF2',
  inputBg:         'rgba(255,255,255,0.05)',
  inputBgFocus:    'rgba(255,255,255,0.08)',
  inputBorder:     'rgba(255,255,255,0.0)',
  inputBorderFocus:'rgba(255,255,255,0.16)',
  selectBg:        '#0A0B0F',
  separator:       'rgba(255,255,255,0.06)',
  accent:          '#EAB308',
  sectionIcon:     '#4B5563',
  checkboxOff:     '#0A0B0F',
  checkboxBorder:  'rgba(255,255,255,0.10)',
} as const

export const INJECTED_CSS = `
/* remove number spinners */
.sk-num::-webkit-inner-spin-button,
.sk-num::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
.sk-num { -moz-appearance:textfield; }
/* select — darker surface like Figma dropdowns */
.sk-sel { appearance:none; -webkit-appearance:none; outline:none; cursor:pointer;
  background: #111110
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath d='M1 1l3 3 3-3' stroke='%236F6E6B' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")
    no-repeat right 8px center; }
.sk-sel option { background:#111110; color:#DCDBD8; }
`

export function Section({ title, right, children }: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{
      position: 'relative',
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 16,
      paddingRight: 8,
    }}>
      {/* Bottom separator on every section */}
      <div style={{
        position: 'absolute', bottom: 0,
        left: -16, right: -8,
        height: 1, background: C.separator,
      }} />
      {/* Header - no own padding */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 24, marginBottom: 8,
      }}>
        <h2 style={{
          fontFamily: 'Inter, var(--font-ui), sans-serif',
          fontSize: SECTION_TITLE_SIZE,
          fontWeight: 500,
          color: C.sectionTitle,
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          {title}
        </h2>
        {right}
      </div>
      {/* Body - no own padding */}
      {children}
    </div>
  )
}

// children is a render-prop receiving the collapse callback
export function CollapsibleSection({ title, children }: {
  title: string
  children: (collapse: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      {/* Bottom separator - matches all other sections */}
      <div style={{
        position: 'absolute', bottom: 0, left: -16, right: -8,
        height: 1, background: C.separator,
      }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: 16, paddingRight: 8,
        height: 36, cursor: 'pointer',
      }} onClick={() => setOpen(true)}>
        <h2 style={{
          fontFamily: 'Inter, var(--font-ui), sans-serif',
          fontSize: SECTION_TITLE_SIZE, fontWeight: 500,
          color: C.sectionTitle, letterSpacing: '-0.01em', margin: 0,
        }}>
          {title}
        </h2>
        {/* "+" always visible in header */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setOpen(true) }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 4,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: C.sectionTitle, flexShrink: 0,
            transition: 'color .12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = C.sectionTitle }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 7v10M7 12h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {open && (
        <div style={{ paddingLeft: 16, paddingRight: 8, paddingBottom: 12 }}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export function TextCell({ label, value, onChange, readOnly, accent, dark }: {
  label: string; value: string; onChange?: (v: string) => void
  readOnly?: boolean; accent?: string; dark?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: dark ? C.selectBg : C.inputBg,
      border: dark ? `1px solid rgba(255,255,255,0.06)` : 'none',
      borderRadius: 4, height: 28,
      padding: '0 8px', minWidth: 0, overflow: 'hidden',
    }}>
      <span style={{ fontSize: 10, color: C.rowLabel, flexShrink: 0 }}>{label}</span>
      {accent ? (
        <span style={{ flex: 1, minWidth: 0, fontSize: 11, color: accent, textAlign: 'right', fontFamily: 'Inter, var(--font-ui), sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </span>
      ) : (
        <input
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={e => onChange?.(e.target.value)}
          style={{
            flex: 1, minWidth: 0, background: 'transparent', border: 'none',
            outline: 'none', color: readOnly ? C.rowLabel : C.valueText, fontSize: 11,
            fontFamily: 'Inter, var(--font-ui), sans-serif',
            textAlign: 'right', cursor: readOnly ? 'default' : 'text',
          }}
        />
      )}
    </div>
  )
}

export function InputCell({ label, value, onChange, min, max, step = 1, unit, disabled }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; step?: number; unit?: string; disabled?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: C.inputBg, borderRadius: 4, height: 28,
      padding: '0 8px', opacity: disabled ? 0.35 : 1,
      transition: 'opacity .15s',
    }}>
      <span style={{ fontSize: 10, color: C.rowLabel, flexShrink: 0, minWidth: 0 }}>
        {label}
      </span>
      <input
        type="number"
        className="sk-num"
        value={value}
        min={min} max={max} step={step}
        disabled={disabled}
        onChange={e => {
          const n = Number(e.target.value)
          if (!isNaN(n)) onChange(n)
        }}
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 'none',
          outline: 'none', color: C.valueText, fontSize: 11,
          fontFamily: 'Inter, var(--font-ui), sans-serif',
          textAlign: 'right', cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {unit && (
        <span style={{ fontSize: 10, color: C.rowLabel, flexShrink: 0 }}>{unit}</span>
      )}
    </div>
  )
}

export function SelectCell({ value, options, onChange, disabled }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <select
      className="sk-sel"
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%',
        height: 28, borderRadius: 4, padding: '0 24px 0 8px',
        border: `1px solid rgba(255,255,255,0.06)`,
        color: C.valueText, fontSize: 11,
        fontFamily: 'Inter, var(--font-ui), sans-serif',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity .15s, border-color .12s',
        outline: 'none',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function Checkbox({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0,
    }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
      />
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        background: checked ? 'rgba(255,255,255,0.12)' : C.checkboxOff,
        border: `1px solid ${checked ? 'rgba(255,255,255,0.22)' : C.checkboxBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .12s, border-color .12s',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5"
              stroke="#E8E8E6" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </label>
  )
}

export function CheckboxRow({ label, checked, onChange, disabled }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 6,
      height: 28, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.35 : 1, transition: 'opacity .15s',
      userSelect: 'none',
    }}>
      <Checkbox checked={checked} onChange={onChange} disabled={disabled} />
      <span style={{ fontSize: 11, color: C.valueText }}>{label}</span>
    </label>
  )
}

const SR_ONLY: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap',
}

export function InputGrid({ legend, children }: {
  legend: string; children: React.ReactNode
}) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0, minWidth: 0, width: '100%', display: 'block' }}>
      <legend style={SR_ONLY}>{legend}</legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: '100%' }}>
        {children}
      </div>
    </fieldset>
  )
}

export function Gap() {
  return <div style={{ height: 4 }} />
}

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
]

export const MOOD_OPTIONS = [
  { value: 'neutral',   label: 'Neutral' },
  { value: 'happy',     label: 'Happy' },
  { value: 'chill',     label: 'Chill' },
  { value: 'hyped',     label: 'Hyped' },
  { value: 'sarcastic', label: 'Sarcastic' },
]
