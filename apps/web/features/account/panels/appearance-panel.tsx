'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Toggle } from '@/shared/ui/toggle'
import {
  Select, SelectTrigger, SelectValue, SelectIcon,
  SelectPortal, SelectContent, SelectViewport,
  SelectItem, SelectItemText, SelectItemIndicator,
  SelectScrollUpButton, SelectScrollDownButton,
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


export default function AppearancePanel() {
  const { t, i18n } = useTranslation('common')
  const { setTheme } = useTheme()
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_PREFS)

  const currentLang = (i18n.language ?? 'en').split('-')[0]

  useEffect(() => { setPrefs(loadAppearancePrefs()) }, [])

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
    try { localStorage.setItem('inktide_lang', code) } catch { /* quota */ }
  }

  return (
    <>
      {/* ── Appearance section ─────────────────────────────────────────────── */}
      <SectionHeader>Appearance</SectionHeader>

      <div className="sm-settings-group">

        {/* Theme */}
        <SettingRow
          label="Theme"
          description="Choose a theme for this device"
          action={
            <Select value={prefs.theme} onValueChange={(v) => { const id = parseTheme(v); if (id) update('theme', id) }}>
              <SelectTrigger
                className={cn(
                  'flex h-8 min-w-[120px] items-center justify-between gap-2 rounded-[8px]',
                  'border border-[var(--settings-input-border)] bg-[var(--surface-2)] px-3',
                  'text-[14px] text-[var(--text-primary)] outline-none cursor-pointer',
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
                  sideOffset={6}
                  align="end"
                  className={cn(
                    'z-[2100] w-[160px] overflow-hidden',
                    'rounded-[10px] border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)]',
                    'shadow-[var(--menu-panel-shadow)]',
                    'py-1',
                  )}
                >
                  <SelectViewport>
                    {THEMES.map(t => (
                      <SelectItem
                        key={t.id}
                        value={t.id}
                        className={cn(
                          'flex items-center mx-1 rounded-[6px] px-3 py-[7px] gap-2',
                          'outline-none cursor-pointer select-none',
                          'data-[highlighted]:bg-[var(--surface-2)]',
                          'data-[state=checked]:bg-[var(--surface-2)]',
                        )}
                      >
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[var(--text-secondary)] [&>svg]:h-[14px] [&>svg]:w-[14px]">
                          {t.icon}
                        </span>
                        <SelectItemText>
                          <span className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">
                            {t.label}
                          </span>
                        </SelectItemText>
                        <SelectItemIndicator className="ml-auto">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--text-primary)" aria-hidden>
                            <path d="M11.834 3.309a.625.625 0 0 1 1.072.642l-5.244 8.74a.625.625 0 0 1-1.01.085L3.155 8.699a.626.626 0 0 1 .95-.813l2.93 3.419z"/>
                          </svg>
                        </SelectItemIndicator>
                      </SelectItem>
                    ))}
                  </SelectViewport>
                </SelectContent>
              </SelectPortal>
            </Select>
          }
        />

        {/* Accent color */}
        <SettingRow label="Accent color" description="Choose the highlight colour used across the app">
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
                    'flex h-7 w-7 cursor-pointer appearance-none items-center justify-center rounded-full border-none transition-transform',
                    active ? 'ring-2 ring-[var(--text-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : 'hover:scale-110',
                  )}
                >
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              )
            })}
            <button
              type="button"
              disabled
              title="Custom (coming soon)"
              className="flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-full bg-[conic-gradient(from_0deg,#ff0080,#7928ca,#0070f3,#00d2ff,#ff0080)] opacity-60"
            />
          </div>
        </SettingRow>

        {/* Compact mode */}
        <SettingRow
          label="Compact mode"
          description="Reduce spacing and element sizes."
          action={<Toggle checked={prefs.compact} onChange={v => update('compact', v)} ariaLabel="Compact mode" />}
        />

        {/* Reduce motion */}
        <SettingRow
          label="Reduce motion"
          description="Minimize animations across the app."
          action={<Toggle checked={prefs.reduceMotion} onChange={v => update('reduceMotion', v)} ariaLabel="Reduce motion" />}
        />

      </div>

      {/* ── Section separator ──────────────────────────────────────────────── */}
      <div className="sm-section-sep" />

      {/* ── Language & time section ────────────────────────────────────────── */}
      <SectionHeader>{t('preferences.languageAndTime.title')}</SectionHeader>

      <div className="sm-settings-group">
        <SettingRow
          label={t('preferences.languageAndTime.language.label')}
          description={t('preferences.languageAndTime.language.description')}
          action={
            <Select value={currentLang} onValueChange={handleLanguageChange}>
              <SelectTrigger
                className={cn(
                  'flex h-8 min-w-[148px] items-center justify-between gap-2 rounded-[8px]',
                  'border border-[var(--settings-input-border)] bg-[var(--surface-2)] px-3',
                  'text-[14px] text-[var(--text-primary)] outline-none cursor-pointer',
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
                  sideOffset={6}
                  align="end"
                  className={cn(
                    'z-[2100] w-[220px] overflow-hidden',
                    'rounded-[10px] border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)]',
                    'shadow-[var(--menu-panel-shadow)]',
                    'py-1',
                  )}
                >
                  <SelectScrollUpButton className="flex h-6 cursor-default items-center justify-center text-[var(--text-tertiary)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="18 15 12 9 6 15"/></svg>
                  </SelectScrollUpButton>
                  <SelectViewport className="max-h-[320px]">
                    {LANGUAGES.map(lang => (
                      <SelectItem
                        key={lang.code}
                        value={lang.code}
                        className={cn(
                          'flex items-center mx-1 rounded-[6px] px-3 py-[7px] gap-2',
                          'outline-none cursor-pointer select-none',
                          'data-[highlighted]:bg-[var(--surface-2)]',
                          'data-[state=checked]:bg-[var(--surface-2)]',
                        )}
                      >
                        <div className="flex flex-col flex-1 min-w-0">
                          <SelectItemText>
                            <span className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">
                              {lang.nativeName}
                            </span>
                          </SelectItemText>
                          {lang.englishName !== lang.nativeName && (
                            <span className="text-[12px] leading-[16px] text-[var(--text-tertiary)] mt-[1px]">
                              {lang.englishName}
                            </span>
                          )}
                        </div>
                        <SelectItemIndicator className="ml-auto shrink-0">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--text-primary)" aria-hidden>
                            <path d="M11.834 3.309a.625.625 0 0 1 1.072.642l-5.244 8.74a.625.625 0 0 1-1.01.085L3.155 8.699a.626.626 0 0 1 .95-.813l2.93 3.419z"/>
                          </svg>
                        </SelectItemIndicator>
                      </SelectItem>
                    ))}
                  </SelectViewport>
                  <SelectScrollDownButton className="flex h-6 cursor-default items-center justify-center text-[var(--text-tertiary)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="6 9 12 15 18 9"/></svg>
                  </SelectScrollDownButton>
                </SelectContent>
              </SelectPortal>
            </Select>
          }
        />
      </div>
    </>
  )
}

// ── Layout primitives ───────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="sm-section-header">{children}</div>
}

function SettingRow({
  label,
  description,
  action,
  children,
}: {
  label: string
  description?: React.ReactNode
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  const control = action ?? children
  return (
    <div className="sm-setting-row">
      <div className="sm-setting-label-col">
        <div className="sm-setting-label">{label}</div>
        {description && (
          <div className="sm-setting-desc">
            {typeof description === 'string' ? <span>{description}</span> : description}
          </div>
        )}
      </div>
      {control && <div className="sm-setting-action-col">{control}</div>}
    </div>
  )
}
