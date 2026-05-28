'use client'
import { cn } from '@/lib/utils'
import type { ProviderFieldDef } from '@/shared/data/providers'

const inputCls = cn(
  'h-9 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3',
  'home-ui-font text-body text-[var(--text-primary)] outline-none',
  'placeholder:text-[var(--text-tertiary)] transition-colors',
  'focus:border-[var(--accent-base)]/50 focus:bg-[var(--surface-2)]',
)

export function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ProviderFieldDef
  value: string
  onChange: (v: string) => void
}) {
  if (field.type === 'select' && field.options) {
    return (
      <div className="relative">
        <select
          value={value || String(field.default ?? '')}
          onChange={e => onChange(e.target.value)}
          className={cn(inputCls, 'appearance-none cursor-pointer pr-8')}
        >
          {field.options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--text-tertiary)]" viewBox="0 0 12 12" fill="none">
          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  if (field.type === 'kv-pairs') {
    const pairs = value ? value.split('\n').map(l => { const [k, ...v] = l.split('='); return { k: k ?? '', v: v.join('=') } }) : []

    const update = (idx: number, k: string, v: string) => {
      const next = [...pairs]
      next[idx] = { k, v }
      onChange(next.filter(p => p.k || p.v).map(p => `${p.k}=${p.v}`).join('\n'))
    }
    const addRow = () => onChange([...pairs, { k: '', v: '' }].map(p => `${p.k}=${p.v}`).join('\n'))
    const removeRow = (idx: number) => {
      const next = pairs.filter((_, i) => i !== idx)
      onChange(next.map(p => `${p.k}=${p.v}`).join('\n'))
    }

    return (
      <div className="space-y-1.5">
        {pairs.map((pair, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text" placeholder="key" value={pair.k}
              onChange={e => update(i, e.target.value, pair.v)}
              className={cn(inputCls, 'flex-1')}
            />
            <span className="text-xs text-[var(--text-tertiary)]">=</span>
            <input
              type="text" placeholder="value" value={pair.v}
              onChange={e => update(i, pair.k, e.target.value)}
              className={cn(inputCls, 'flex-1')}
            />
            <button type="button" onClick={() => removeRow(i)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] transition-colors">
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
        <button type="button" onClick={addRow} className="home-ui-font flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-body text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)] transition-colors">
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add header
        </button>
      </div>
    )
  }

  return (
    <input
      type={field.type === 'password' ? 'password' : 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      className={inputCls}
      autoComplete={field.type === 'password' ? 'new-password' : 'off'}
    />
  )
}
