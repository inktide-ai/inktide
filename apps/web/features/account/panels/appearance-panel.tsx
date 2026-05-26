'use client'

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Toggle } from '@/shared/ui/toggle'
import {
  ACCENT_COLORS,
  ACCENT_NAMES,
  DEFAULT_APPEARANCE_PREFS,
  loadAppearancePrefs,
  saveAppearancePrefs,
  type AppearancePrefs,
} from '@/lib/user-appearance'

const DEFAULT_PREFS = DEFAULT_APPEARANCE_PREFS

const THEMES: { id: AppearancePrefs['theme']; label: string; icon: React.ReactNode }[] = [
  {
    id: 'dark',
    label: 'Dark',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
    ),
  },
  {
    id: 'light',
    label: 'Light',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
    ),
  },
  {
    id: 'system',
    label: 'System',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
    ),
  },
]

const FONT_SIZES: { id: AppearancePrefs['fontSize']; label: string; sample: string }[] = [
  { id: 'sm', label: 'Small', sample: '13' },
  { id: 'md', label: 'Medium', sample: '14' },
  { id: 'lg', label: 'Large', sample: '16' },
]

function parseTheme(next: string | undefined): AppearancePrefs['theme'] | undefined {
  if (next !== 'dark' && next !== 'light' && next !== 'system') return undefined
  return next
}

function parseFontSize(next: string | undefined): AppearancePrefs['fontSize'] | undefined {
  if (next !== 'sm' && next !== 'md' && next !== 'lg') return undefined
  return next
}

export default function AppearancePanel() {
  const { setTheme } = useTheme()
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_PREFS)

  useEffect(() => {
    setPrefs(loadAppearancePrefs())
  }, [])

  function update<K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value }
      saveAppearancePrefs(next)
      if (key === 'theme')
        setTheme(value as string)
      return next
    })
  }

  return (
    <>
      {/* ── Theme ─────────────────────────────────────────────────────────── */}
      <div className="mt-[36px]" />
      <SectionHeader>Theme</SectionHeader>

      <ToggleGroupPrimitive.Root
        type="single"
        value={prefs.theme}
        onValueChange={(next: string | undefined) => {
          const id = parseTheme(next ?? '')
          if (id !== undefined)
            update('theme', id)
        }}
        className="flex w-full min-w-0 items-stretch gap-3"
        aria-label="Theme"
      >
        {THEMES.map(t => (
          <ToggleGroupPrimitive.Item
            key={t.id}
            value={t.id}
            aria-label={t.label}
            className={cn(
              'group relative flex min-h-0 flex-1 basis-0 cursor-pointer appearance-none flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-solid bg-[var(--surface-1)] py-5 text-center outline-none transition-colors',
              'h-[102px]',
              'focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
              'data-[state=off]:border-[var(--settings-input-border)] hover:data-[state=off]:border-[var(--border-strong)]',
              'data-[state=on]:border-[var(--accent-primary)] data-[state=on]:bg-[var(--accent-violet-bg)]/40',
            )}
          >
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-[10px] [&>svg]:h-[18px] [&>svg]:w-[18px]',
                'group-data-[state=on]:bg-[var(--accent-primary)] group-data-[state=on]:text-white',
                'group-data-[state=off]:bg-[var(--surface-2)] group-data-[state=off]:text-[var(--text-secondary)]',
              )}
            >
              {t.icon}
            </div>
            <span
              className={cn(
                'text-[14px] font-medium',
                'group-data-[state=on]:text-[var(--text-heading)]',
                'group-data-[state=off]:text-[var(--text-secondary)]',
              )}
            >
              {t.label}
            </span>
            <span className="absolute right-2 top-2 hidden h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white group-data-[state=on]:flex">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>

      {/* ── Accent Color ──────────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Accent color</SectionHeader>

      <div className="flex items-center gap-2">
        {ACCENT_COLORS.map((c) => {
          const active = prefs.accentColor === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => update('accentColor', c)}
              title={ACCENT_NAMES[c]}
              style={{ background: c }}
              className={cn(
                'flex h-8 w-8 cursor-pointer appearance-none items-center justify-center rounded-full border-none transition-transform',
                active ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : 'hover:scale-105',
              )}
            >
              {active && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </button>
          )
        })}
        <button
          type="button"
          disabled
          title="Custom (coming soon)"
          className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-full bg-[conic-gradient(from_0deg,#ff0080,#7928ca,#0070f3,#00d2ff,#ff0080)] opacity-60"
        />
      </div>

      {/* ── Font Size ─────────────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Font size</SectionHeader>

      <ToggleGroupPrimitive.Root
        type="single"
        value={prefs.fontSize}
        onValueChange={(next: string | undefined) => {
          const id = parseFontSize(next ?? '')
          if (id !== undefined)
            update('fontSize', id)
        }}
        className="flex w-full min-w-0 items-stretch gap-3"
        aria-label="Font size"
      >
        {FONT_SIZES.map(f => (
          <ToggleGroupPrimitive.Item
            key={f.id}
            value={f.id}
            aria-label={f.label}
            className={cn(
              'group box-border flex min-h-0 flex-1 basis-0 cursor-pointer appearance-none flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-solid bg-[var(--surface-1)] py-3 text-center outline-none transition-colors',
              'h-[76px]',
              'focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
              'data-[state=off]:border-[var(--settings-input-border)] hover:data-[state=off]:border-[var(--border-strong)]',
              'data-[state=on]:border-[var(--accent-primary)] data-[state=on]:bg-[var(--accent-violet-bg)]/40',
            )}
          >
            <span
              className={cn(
                'font-semibold leading-none',
                'group-data-[state=on]:text-[var(--text-heading)]',
                'group-data-[state=off]:text-[var(--text-secondary)]',
              )}
              style={{ fontSize: `${f.sample}px` }}
            >
              Aa
            </span>
            <span
              className={cn(
                'text-[14px]',
                'group-data-[state=on]:text-[var(--text-heading)]',
                'group-data-[state=off]:text-[var(--text-tertiary)]',
              )}
            >
              {f.label}
            </span>
          </ToggleGroupPrimitive.Item>
        ))}
      </ToggleGroupPrimitive.Root>

      {/* ── Display ───────────────────────────────────────────────────────── */}
      <div className="mt-[48px]" />
      <SectionHeader>Display</SectionHeader>

      <div>
        <SecurityRow
          label="Compact mode"
          value="Reduce spacing and element sizes."
          action={<Toggle checked={prefs.compact} onChange={v => update('compact', v)} ariaLabel="Compact mode" />}
        />

        <div className="h-[24px]" />
        <SecurityRow
          label="Reduce motion"
          value="Minimize animations across the app."
          action={<Toggle checked={prefs.reduceMotion} onChange={v => update('reduceMotion', v)} ariaLabel="Reduce motion" />}
        />
      </div>
    </>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[16px] mt-0 border-b border-[var(--settings-card-border)] pb-[12px] text-[16px] font-medium text-[var(--text-heading)]">
      {children}
    </div>
  )
}

function SecurityRow({
  label,
  value,
  action,
}: {
  label: string
  value: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-[11px]">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">{label}</div>
        <div className="text-[14px] font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">
          {typeof value === 'string' ? <span className="break-words">{value}</span> : value}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
