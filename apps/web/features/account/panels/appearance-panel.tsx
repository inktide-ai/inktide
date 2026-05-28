'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { ToggleGroup, ToggleGroupItem } from '@/shared/ui/toggle-group'
import { Toggle } from '@/shared/ui/toggle'
import {
  Select, SelectTrigger, SelectValue, SelectIcon,
  SelectPortal, SelectContent, SelectViewport,
  SelectItem, SelectItemText, SelectItemIndicator,
} from '@/shared/ui'
import {
  ACCENT_COLORS,
  ACCENT_NAMES,
  DEFAULT_APPEARANCE_PREFS,
  loadAppearancePrefs,
  saveAppearancePrefs,
  type AppearancePrefs,
} from '@/shared/lib/user-appearance'

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

// v1: EN + RU only. Future locales are commented stubs.
const LANGUAGES = [
  { code: 'en', nativeName: 'English (US)', englishName: 'English (US)' },
  { code: 'ru', nativeName: 'Русский',       englishName: 'Russian'       },
  // { code: 'de', nativeName: 'Deutsch',                englishName: 'German'           },
  // { code: 'fr', nativeName: 'Français (France)',      englishName: 'French (France)'  },
  // { code: 'es', nativeName: 'Español',                englishName: 'Spanish'          },
  // { code: 'ja', nativeName: '日本語',                  englishName: 'Japanese'         },
  // { code: 'zh', nativeName: '中文',                   englishName: 'Chinese'          },
  // { code: 'ko', nativeName: '한국어',                  englishName: 'Korean'           },
  // { code: 'pt', nativeName: 'Português',              englishName: 'Portuguese'       },
  // { code: 'nl', nativeName: 'Nederlands',             englishName: 'Dutch'            },
] as const

function parseTheme(next: string | undefined): AppearancePrefs['theme'] | undefined {
  if (next !== 'dark' && next !== 'light' && next !== 'system') return undefined
  return next
}

function parseFontSize(next: string | undefined): AppearancePrefs['fontSize'] | undefined {
  if (next !== 'sm' && next !== 'md' && next !== 'lg') return undefined
  return next
}

export default function AppearancePanel() {
  const { t, i18n } = useTranslation('common')
  const { setTheme } = useTheme()
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_PREFS)

  // Normalize 'en-US' → 'en'
  const currentLang = (i18n.language ?? 'en').split('-')[0]

  useEffect(() => {
    setPrefs(loadAppearancePrefs())
  }, [])

  function update<K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) {
    setPrefs((p) => {
      const next = { ...p, [key]: value }
      saveAppearancePrefs(next)
      if (key === 'theme') setTheme(value as string)
      return next
    })
  }

  function handleLanguageChange(code: string) {
    void i18n.changeLanguage(code)
    try { localStorage.setItem('inktide_lang', code) } catch { /* storage quota */ }
  }

  return (
    <>
      {/* ── Preferences ───────────────────────────────────────────────────── */}
      <div className="mt-[36px]" />
      <SectionHeader>{t('preferences.title')}</SectionHeader>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <SubsectionHeader>{t('preferences.appearance.title')}</SubsectionHeader>

      {/* Theme */}
      <ToggleGroup
        type="single"
        value={prefs.theme}
        onValueChange={(next: string | undefined) => {
          const id = parseTheme(next ?? '')
          if (id !== undefined) update('theme', id)
        }}
        className="flex w-full min-w-0 items-stretch gap-3"
        aria-label="Theme"
      >
        {THEMES.map(t => (
          <ToggleGroupItem
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
                'text-body font-medium',
                'group-data-[state=on]:text-[var(--text-heading)]',
                'group-data-[state=off]:text-[var(--text-secondary)]',
              )}
            >
              {t.label}
            </span>
            <span className="absolute right-2 top-2 hidden h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white group-data-[state=on]:flex">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Accent Color */}
      <div className="mt-[32px]" />
      <GroupLabel>Accent color</GroupLabel>
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

      {/* Font Size */}
      <div className="mt-[32px]" />
      <GroupLabel>Font size</GroupLabel>
      <ToggleGroup
        type="single"
        value={prefs.fontSize}
        onValueChange={(next: string | undefined) => {
          const id = parseFontSize(next ?? '')
          if (id !== undefined) update('fontSize', id)
        }}
        className="flex w-full min-w-0 items-stretch gap-3"
        aria-label="Font size"
      >
        {FONT_SIZES.map(f => (
          <ToggleGroupItem
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
                'text-body',
                'group-data-[state=on]:text-[var(--text-heading)]',
                'group-data-[state=off]:text-[var(--text-tertiary)]',
              )}
            >
              {f.label}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* Display */}
      <div className="mt-[32px]" />
      <GroupLabel>Display</GroupLabel>
      <div>
        <SettingRow
          label="Compact mode"
          description="Reduce spacing and element sizes."
          action={<Toggle checked={prefs.compact} onChange={v => update('compact', v)} ariaLabel="Compact mode" />}
        />
        <SettingRow
          label="Reduce motion"
          description="Minimize animations across the app."
          action={<Toggle checked={prefs.reduceMotion} onChange={v => update('reduceMotion', v)} ariaLabel="Reduce motion" />}
        />
      </div>

      {/* ── Language & time ────────────────────────────────────────────────── */}
      <div className="mt-[32px] border-t border-[var(--settings-card-border)]" />
      <SubsectionHeader className="mt-[20px]">{t('preferences.languageAndTime.title')}</SubsectionHeader>

      <SettingRow
        label={t('preferences.languageAndTime.language.label')}
        description={t('preferences.languageAndTime.language.description')}
        action={
          <Select value={currentLang} onValueChange={handleLanguageChange}>
            <SelectTrigger
              className={cn(
                'flex h-8 min-w-[148px] items-center justify-between gap-2 rounded-[8px]',
                'border border-[var(--settings-input-border)] bg-[var(--surface-2)] px-3',
                'text-body text-[var(--text-primary)] outline-none cursor-pointer',
                'hover:border-[var(--border-strong)] transition-colors',
                'focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
              )}
            >
              <SelectValue />
              <SelectIcon asChild>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9"/></svg>
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                position="popper"
                sideOffset={4}
                className={cn(
                  'z-[500] min-w-[var(--radix-select-trigger-width)] overflow-hidden',
                  'rounded-[10px] border border-[var(--border-subtle)] bg-[var(--surface-1)]',
                  'shadow-[0_8px_24px_-4px_rgba(0,0,0,0.18)] p-1',
                )}
              >
                <SelectViewport>
                  {LANGUAGES.map(lang => (
                    <SelectItem
                      key={lang.code}
                      value={lang.code}
                      className={cn(
                        'relative flex flex-col rounded-[6px] px-3 py-2 outline-none cursor-pointer select-none',
                        'data-[highlighted]:bg-[var(--surface-2)]',
                        'data-[state=checked]:bg-[var(--accent-primary)]/10',
                      )}
                    >
                      <SelectItemText>
                        <span className="text-body font-medium text-[var(--text-primary)]">
                          {lang.nativeName}
                        </span>
                      </SelectItemText>
                      {lang.englishName !== lang.nativeName && (
                        <span className="text-[11px] text-[var(--text-tertiary)] leading-tight mt-0.5">
                          {lang.englishName}
                        </span>
                      )}
                      <SelectItemIndicator className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="20 6 9 17 4 12"/></svg>
                      </SelectItemIndicator>
                    </SelectItem>
                  ))}
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </Select>
        }
      />
    </>
  )
}

// ── Layout primitives ──────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[16px] mt-0 border-b border-[var(--settings-card-border)] pb-[12px] text-[16px] font-medium text-[var(--text-heading)]">
      {children}
    </div>
  )
}

function SubsectionHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-[14px] text-[13px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide', className)}>
      {children}
    </div>
  )
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-[10px] text-body font-medium text-[var(--text-secondary)]">
      {children}
    </div>
  )
}

function SettingRow({
  label,
  description,
  action,
}: {
  label: string
  description: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-[11px]">
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <div className="text-body font-medium leading-[20px] text-[var(--text-primary)]">{label}</div>
        <div className="text-body font-normal leading-[18px] text-pretty text-[var(--text-secondary)]">
          {typeof description === 'string' ? <span className="break-words">{description}</span> : description}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
