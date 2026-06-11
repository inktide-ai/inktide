'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Check, File, FileText, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProject, updateProject, resetProjectSystemPrompt, type Project } from '@/features/projects'
import { DEFAULTS } from '@/shared/lib/character/defaults'
import {
  BehaviorSchema, AutoPilotSchema,
  type BehaviorConfig, type AutoPilotConfig,
} from '@/shared/lib/character/schemas'
import { handleError } from '@/shared/lib/handle-error'
import { Toggle } from '@/shared/ui/toggle'
import {
  PageContent,
  Select, SelectTrigger, SelectValue, SelectIcon,
  SelectPortal, SelectContent, SelectViewport,
  SelectItem, SelectItemText, SelectItemIndicator,
  SelectScrollUpButton, SelectScrollDownButton,
} from '@/shared/ui'


const MAX_CHARS = 8000

const RESPONSE_LANGS = [
  { code: 'en', label: 'English'    },
  { code: 'ru', label: 'Русский'    },
  { code: 'zh', label: '中文'        },
  { code: 'ja', label: '日本語'      },
  { code: 'ko', label: '한국어'      },
  { code: 'de', label: 'Deutsch'    },
  { code: 'fr', label: 'Français'   },
  { code: 'es', label: 'Español'    },
  { code: 'pt', label: 'Português'  },
] as const

const MOODS = ['neutral', 'happy', 'chill', 'melancholic', 'hyped'] as const


function parseJson<T>(schema: { parse: (v: unknown) => T }, raw: unknown): T {
  const obj = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : (raw ?? {})
  return schema.parse(obj)
}


function SectionHeader({ children }: { children: React.ReactNode }) {
  return <div className="sm-section-header">{children}</div>
}

function SettingRow({ label, description, action }: {
  label: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="sm-setting-row">
      <div className="sm-setting-label-col">
        <div className="sm-setting-label">{label}</div>
        {description && <div className="sm-setting-desc"><span>{description}</span></div>}
      </div>
      {action && <div className="sm-setting-action-col">{action}</div>}
    </div>
  )
}

const selectTriggerCls = cn(
  'flex h-8 min-w-[148px] items-center justify-between gap-2 rounded-[8px]',
  'bg-[var(--surface-2)] px-3',
  'text-[14px] text-[var(--text-primary)] outline-none cursor-pointer',
  'hover:border-[var(--border-strong)] transition-colors',
  'focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)]',
)

const selectContentCls = cn(
  'z-[2100] overflow-hidden',
  'rounded-[10px] border border-[var(--border-subtle)] bg-[var(--menu-panel-bg)]',
  'shadow-[var(--menu-panel-shadow)] py-1',
  'data-[state=open]:animate-menu-in data-[state=closed]:animate-menu-out',
)

const selectItemCls = cn(
  'flex items-center mx-1 rounded-[6px] px-3 py-[7px] gap-2',
  'outline-none cursor-pointer select-none',
  'data-[highlighted]:bg-[var(--surface-2)] data-[state=checked]:bg-[var(--surface-2)]',
)

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const ChevronUp = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="18 15 12 9 6 15" />
  </svg>
)

const Checkmark = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--text-primary)" aria-hidden>
    <path d="M11.834 3.309a.625.625 0 0 1 1.072.642l-5.244 8.74a.625.625 0 0 1-1.01.085L3.155 8.699a.626.626 0 0 1 .95-.813l2.93 3.419z" />
  </svg>
)

function NumInput({ value, onChange, min, max, step = 1 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      className={cn(
        'h-8 w-[90px] rounded-[8px]',
        'bg-[var(--surface-2)]',
        'px-3 text-[14px] text-[var(--text-primary)] outline-none tabular-nums text-right',
        'focus:border-[var(--accent-primary)] transition-colors',
      )}
    />
  )
}


type SaveState  = 'idle' | 'saving'    | 'saved'   | 'error'
type ResetState = 'idle' | 'resetting' | 'reset'

export default function ProjectSkillsPage() {
  const { t } = useTranslation('behavior')
  const { id } = useParams<{ id: string }>()

  const [project, setProject]       = useState<Project | null>(null)
  const [loading, setLoading]       = useState(true)
  const [saveState, setSaveState]   = useState<SaveState>('idle')
  const [resetState, setResetState] = useState<ResetState>('idle')

  const [prompt, setPrompt]     = useState<string>(DEFAULTS.systemPrompt)
  const [behavior, setBehavior] = useState<BehaviorConfig>(BehaviorSchema.parse({}))
  const [pilot, setPilot]       = useState<AutoPilotConfig>(AutoPilotSchema.parse({}))

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getProject(id)
      .then(p => {
        setProject(p)
        setPrompt(p.system_prompt ?? DEFAULTS.systemPrompt)
        setBehavior(parseJson(BehaviorSchema, p.response_behavior))
        setPilot(parseJson(AutoPilotSchema, p.auto_pilot))
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  async function handleReset() {
    if (!project || resetState === 'resetting') return
    setResetState('resetting')
    try {
      await resetProjectSystemPrompt(id)
      setProject(p => p ? { ...p, system_prompt: null } : null)
      setPrompt(DEFAULTS.systemPrompt)
      setResetState('reset')
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setResetState('idle'), 2000)
    } catch {
      setResetState('idle')
    }
  }

  const isUsingDefault = project?.system_prompt === null
  const showingDefault = isUsingDefault && prompt === DEFAULTS.systemPrompt

  async function handleSave() {
    if (!project || saveState === 'saving') return
    setSaveState('saving')
    try {
      const systemPromptPayload = isUsingDefault && prompt === DEFAULTS.systemPrompt
        ? null
        : prompt.trim() || null

      const updated = await updateProject(id, {
        name: project.name,
        system_prompt: systemPromptPayload,
        response_behavior: JSON.stringify(behavior),
        auto_pilot: JSON.stringify(pilot),
      })
      setProject(updated)
      setPrompt(updated.system_prompt ?? DEFAULTS.systemPrompt)
      setSaveState('saved')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  return (
    <PageContent>
      <div className="flex flex-col gap-7">

        <header className="flex flex-col gap-2">
          <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">{t('projectSkills.systemPrompt')}</h2>
          <span className="text-body text-balance text-[var(--text-secondary)]">{t('projectSkills.systemPromptDesc')}</span>
        </header>

        <section>
          {/* section label row — above the card */}
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[var(--text-tertiary)]" />
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">{t('projectSkills.directive')}</span>
              {showingDefault && (
                <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
                  {t('projectSkills.default')}
                </span>
              )}
            </div>
            <div className="flex flex-col items-stretch gap-2 md:flex-row">
              <button
                type="button"
                onClick={handleReset}
                disabled={showingDefault || resetState === 'resetting'}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-transparent px-4 text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-subtle)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resetState === 'resetting' && <Loader2 size={13} className="animate-spin mr-1.5" />}
                {resetState === 'reset'     && <Check   size={13} className="mr-1.5" />}
                {resetState === 'resetting' ? t('projectSkills.resetting') : resetState === 'reset' ? t('projectSkills.cleared') : t('projectSkills.reset')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === 'saving'}
                className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md bg-[var(--text-primary)] px-4 text-body font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saveState === 'saving' && <Loader2 size={13} className="animate-spin mr-1.5" />}
                {saveState === 'saved'  && <Check   size={13} className="mr-1.5" />}
                {saveState === 'saving' ? t('projectSkills.saving') : saveState === 'saved' ? t('projectSkills.saved') : saveState === 'error' ? t('projectSkills.error') : t('projectSkills.save')}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px]">

            {/* terminal body */}
            <div className="bg-[var(--surface-2)]">
              {/* dots */}
              <div className="flex items-center gap-[6px] px-4 pt-3 pb-5">
                <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
                <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value.slice(0, MAX_CHARS))}
                rows={10}
                className={cn(
                  'w-full resize-none bg-transparent',
                  'px-4 pb-4 font-mono text-[13px] leading-relaxed',
                  'outline-none placeholder:text-[var(--text-disabled)]',
                  showingDefault ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]',
                )}
              />
            </div>

            {/* status bar */}
            <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-2">
              <div className="flex items-center gap-2">
                <File size={11} className="text-[var(--text-tertiary)]" />
                <span className="font-mono text-[12px] text-[var(--text-tertiary)]">config.yaml</span>
                <span className="font-mono text-[12px] text-[var(--text-disabled)]">|</span>
                <span className="font-mono text-[12px] text-[var(--text-secondary)]">
                  {showingDefault ? t('projectSkills.statusDefault') : isUsingDefault ? t('projectSkills.statusUnsaved') : t('projectSkills.statusOverride')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('font-mono text-[12px] tabular-nums', prompt.length >= MAX_CHARS ? 'text-amber-400' : 'text-[var(--text-tertiary)]')}>
                  {prompt.length.toLocaleString()} {t('projectSkills.chars')}
                </span>
                <span className={cn('font-mono text-[12px] tabular-nums', prompt.length >= MAX_CHARS ? 'text-amber-400' : 'text-[var(--text-primary)]')}>
                  ~{Math.round(prompt.length / 4).toLocaleString()} {t('projectSkills.tokens')}
                </span>
              </div>
            </div>

          </div>
        </section>

        <section>
          <SectionHeader>{t('projectSkills.responseBehavior')}</SectionHeader>
          <div className="sm-settings-group">

            <SettingRow
              label={t('projectSkills.language')}
              description={t('projectSkills.languageDesc')}
              action={
                <Select value={behavior.language} onValueChange={v => setBehavior(b => ({ ...b, language: v }))}>
                  <SelectTrigger className={selectTriggerCls}>
                    <SelectValue />
                    <SelectIcon asChild><ChevronDown /></SelectIcon>
                  </SelectTrigger>
                  <SelectPortal>
                    <SelectContent position="popper" sideOffset={6} align="end" className={cn(selectContentCls, 'w-[180px]')}>
                      <SelectScrollUpButton className="flex h-6 cursor-default items-center justify-center text-[var(--text-tertiary)]"><ChevronUp /></SelectScrollUpButton>
                      <SelectViewport className="max-h-[280px]">
                        {RESPONSE_LANGS.map(l => (
                          <SelectItem key={l.code} value={l.code} className={selectItemCls}>
                            <SelectItemText>
                              <span className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)]">{l.label}</span>
                            </SelectItemText>
                            <SelectItemIndicator className="ml-auto"><Checkmark /></SelectItemIndicator>
                          </SelectItem>
                        ))}
                      </SelectViewport>
                      <SelectScrollDownButton className="flex h-6 cursor-default items-center justify-center text-[var(--text-tertiary)]"><ChevronDown /></SelectScrollDownButton>
                    </SelectContent>
                  </SelectPortal>
                </Select>
              }
            />
            <div className="h-[24px]" />

            <SettingRow
              label={t('projectSkills.responseDelay')}
              description={t('projectSkills.responseDelayDesc')}
              action={<NumInput value={behavior.response_delay_ms} onChange={v => setBehavior(b => ({ ...b, response_delay_ms: Math.max(0, v) }))} min={0} max={10000} step={100} />}
            />
            <div className="h-[24px]" />

            <SettingRow
              label={t('projectSkills.maxLength')}
              description={t('projectSkills.maxLengthDesc')}
              action={<NumInput value={behavior.max_response_length} onChange={v => setBehavior(b => ({ ...b, max_response_length: Math.max(1, v) }))} min={1} max={4000} />}
            />
            <div className="h-[24px]" />

            <SettingRow
              label={t('projectSkills.typingSimulation')}
              description={t('projectSkills.typingSimulationDesc')}
              action={<Toggle checked={behavior.typing_simulation} onChange={v => setBehavior(b => ({ ...b, typing_simulation: v }))} ariaLabel={t('projectSkills.typingSimulation')} />}
            />
            <div className="h-[24px]" />

            <SettingRow
              label={t('projectSkills.autoModerate')}
              description={t('projectSkills.autoModerateDesc')}
              action={<Toggle checked={behavior.auto_moderate} onChange={v => setBehavior(b => ({ ...b, auto_moderate: v }))} ariaLabel={t('projectSkills.autoModerate')} />}
            />

          </div>
        </section>

        <section>
          <SectionHeader>{t('projectSkills.autoPilot')}</SectionHeader>
          <div className="sm-settings-group">

            <SettingRow
              label={t('projectSkills.enabled')}
              description={t('projectSkills.enabledDesc')}
              action={<Toggle checked={pilot.enabled} onChange={v => setPilot(p => ({ ...p, enabled: v }))} ariaLabel={t('projectSkills.autoPilotEnabledAria')} />}
            />

            <div className={cn('transition-opacity duration-200', pilot.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none')}>
              <div className="h-[24px]" />
              <SettingRow
                label={t('projectSkills.idleTimeout')}
                description={t('projectSkills.idleTimeoutDesc')}
                action={<NumInput value={pilot.idle_timeout_seconds} onChange={v => setPilot(p => ({ ...p, idle_timeout_seconds: Math.max(10, v) }))} min={10} max={3600} step={10} />}
              />
              <div className="h-[24px]" />
              <SettingRow
                label={t('projectSkills.minInterval')}
                description={t('projectSkills.minIntervalDesc')}
                action={<NumInput value={pilot.min_interval_seconds} onChange={v => setPilot(p => ({ ...p, min_interval_seconds: Math.max(10, v) }))} min={10} max={600} step={10} />}
              />
              <div className="h-[24px]" />
              <SettingRow
                label={t('projectSkills.defaultMood')}
                description={t('projectSkills.defaultMoodDesc')}
                action={
                  <Select value={pilot.mood} onValueChange={v => setPilot(p => ({ ...p, mood: v }))}>
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue />
                      <SelectIcon asChild><ChevronDown /></SelectIcon>
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectContent position="popper" sideOffset={6} align="end" className={cn(selectContentCls, 'w-[160px]')}>
                        <SelectViewport>
                          {MOODS.map(m => (
                            <SelectItem key={m} value={m} className={selectItemCls}>
                              <SelectItemText>
                                <span className="text-[14px] font-medium leading-[20px] text-[var(--text-primary)] capitalize">{m}</span>
                              </SelectItemText>
                              <SelectItemIndicator className="ml-auto"><Checkmark /></SelectItemIndicator>
                            </SelectItem>
                          ))}
                        </SelectViewport>
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                }
              />
            </div>

          </div>
        </section>

      </div>
    </PageContent>
  )
}
