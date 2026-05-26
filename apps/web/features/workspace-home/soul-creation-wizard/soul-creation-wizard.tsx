'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Atom, CaretRightSmall, Microphone } from '@/components/icons'
import { LLM_PROVIDER_CATALOG } from '@/shared/data/llm-providers'
import { VOICE_PROVIDER_CATALOG } from '@/shared/data/voice-providers'
import { cn } from '@/lib/utils'
import { TetrisBackground } from '../tetris-background'
import { PersonalityWorkspace } from '../personality-workspace'
import type { CharacterPersonality } from '@/shared/lib/character'
import { createDefaultCharacter } from '@/shared/lib/character/defaults'
import type { AiCharacter } from '@/shared/lib/character/types'
import { SOUL_TEMPLATES, type SoulTemplate } from '@/shared/data/soul-templates'
import { STEPS } from './wizard-steps'
import type { WizardProviderItem } from './wizard-provider-card'
import { WizardProviderPanel } from './wizard-provider-panel'
import { WizardChannelsPanel } from './wizard-channels-panel'
import { WizardFinishPanel } from './wizard-finish-panel'
import { TemplateSectionLabel, TemplateListItem } from './wizard-template-picker'

type Screen = 'templates' | 'steps' | 'llm' | 'tts' | 'channels' | 'finish'

type StepSelection = { id: string; name: string; config?: Record<string, string> }

const WIZARD_TTL_MS = 24 * 60 * 60 * 1000

const WIZARD_KEYS = [
  'v1_inktide_wizard_selections',
  'v1_inktide_wizard_channels',
  'v1_inktide_wizard_personality',
  'v1_inktide_wizard_template',
] as const

function loadWithTTL<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const { value, ts } = JSON.parse(raw) as { value: T; ts: number }
    if (Date.now() - ts > WIZARD_TTL_MS) { localStorage.removeItem(key); return fallback }
    return value
  } catch { return fallback }
}

function saveWithTTL(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify({ value, ts: Date.now() })) } catch { /* ignore */ }
}

function clearWizardDraft() {
  WIZARD_KEYS.forEach(k => localStorage.removeItem(k))
}

const screenVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -24 }),
}

const panelTransition = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const }

const panelMotionProps = {
  variants: screenVariants,
  initial: 'enter' as const,
  animate: 'center' as const,
  exit: 'exit' as const,
  transition: panelTransition,
}

const DEFAULT_PERSONALITY: CharacterPersonality = {
  warmth: 0.7, playfulness: 0.5, assertiveness: 0.5, empathy: 0.7,
  formality: 0.3, sarcasm: 0.2, emotionVolatility: 0.5,
  emotionResponsiveness: 0.7, emotionMemory: 0.5,
  stressBehavior: 'deflect', baselineMood: 'neutral', presetId: null,
}


export interface SoulCreationWizardProps {
  onBack: () => void
  onFinish?: (character: Omit<AiCharacter, 'id'>, discordBotToken?: string) => Promise<string | null>
  onStep?: (stepId: string) => void
  onLlmSelect?: (providerId: string, config?: Record<string, string>) => void
  onTtsSelect?: (providerId: string, config?: Record<string, string>) => void
}

export function SoulCreationWizard({ onBack, onFinish, onStep, onLlmSelect, onTtsSelect }: SoulCreationWizardProps) {
  const [screen, setScreen] = useState<Screen>('templates')
  const [direction, setDirection] = useState<1 | -1>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [stepSelections, setStepSelections] = useState<Record<string, StepSelection>>(
    () => loadWithTTL<Record<string, StepSelection>>('v1_inktide_wizard_selections', {}),
  )
  const [personalityOpen, setPersonalityOpen] = useState(false)
  const [personalityConfig, setPersonalityConfig] = useState<CharacterPersonality>(
    () => loadWithTTL<CharacterPersonality>('v1_inktide_wizard_personality', DEFAULT_PERSONALITY),
  )
  const [personalityConfigured, setPersonalityConfigured] = useState(
    () => localStorage.getItem('v1_inktide_wizard_personality') !== null,
  )
  const [channelsSelected, setChannelsSelected] = useState<string[]>(
    () => loadWithTTL<string[]>('v1_inktide_wizard_channels', []),
  )

  const navigate = (to: Screen, dir: 1 | -1) => {
    setDirection(dir)
    setScreen(to)
  }

  const llmItems = useMemo<WizardProviderItem[]>(() =>
    LLM_PROVIDER_CATALOG.map(p => ({ id: p.id, name: p.name, subtitle: p.model, iconSrc: p.iconSrc, darkIcon: p.darkIcon })),
    [],
  )
  const ttsItems = useMemo<WizardProviderItem[]>(() =>
    VOICE_PROVIDER_CATALOG.map(p => ({ id: p.id, name: p.name, iconSrc: p.iconSrc, darkIcon: p.darkIcon })),
    [],
  )

  const handleSelectTemplate = (tmpl: SoulTemplate | null) => {
    if (tmpl) {
      setSelectedTemplate(tmpl.id)
      saveWithTTL('v1_inktide_wizard_template', { id: tmpl.id, personality: tmpl.personality })
    } else {
      setSelectedTemplate(null)
      localStorage.removeItem('v1_inktide_wizard_template')
    }
    navigate('steps', 1)
  }

  const handlePersonalityChange = (p: CharacterPersonality) => {
    setPersonalityConfig(p)
    saveWithTTL('v1_inktide_wizard_personality', p)
  }

  const handlePersonalityClose = () => {
    setPersonalityOpen(false)
    setPersonalityConfigured(true)
  }

  const buildCharacter = (name: string): Omit<AiCharacter, 'id'> => {
    const base = createDefaultCharacter()
    const template = SOUL_TEMPLATES.find(t => t.id === selectedTemplate)
    return {
      ...base,
      name,
      personality:  template?.personality ?? '',
      systemPrompt: template?.personality ?? base.systemPrompt,
      llm: {
        ...base.llm,
        providerId: stepSelections.llm?.id ?? null,
        baseUrl:    stepSelections.llm?.config?.baseUrl ?? null,
      },
      tts: {
        ...base.tts,
        providerId: stepSelections.tts?.id ?? null,
        apiKey:     stepSelections.tts?.config?.apiKey ?? null,
      },
      personalityConfig,
    }
  }

  const handleStepClick = (stepId: string) => {
    if (stepId === 'llm' || stepId === 'tts') { navigate(stepId as Screen, 1); return }
    if (stepId === 'channels') { navigate('channels', 1); return }
    if (stepId === 'personality') { setPersonalityOpen(true); return }
    if (stepId === 'finish') { navigate('finish', 1); return }
    onStep?.(stepId)
  }

  const handleProviderSelect = (stepId: string, id: string, name: string, config?: Record<string, string>) => {
    const updated = { ...stepSelections, [stepId]: { id, name, config } }
    setStepSelections(updated)
    saveWithTTL('v1_inktide_wizard_selections', updated)
    if (stepId === 'llm') onLlmSelect?.(id, config)
    if (stepId === 'tts') onTtsSelect?.(id, config)
    navigate('steps', -1)
  }

  const handleBack = () => {
    if (personalityOpen) { setPersonalityOpen(false); return }
    if (screen === 'finish' || screen === 'llm' || screen === 'tts' || screen === 'channels') navigate('steps', -1)
    else if (screen === 'steps') navigate('templates', -1)
    else { clearWizardDraft(); onBack() }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--bg-0)]">
      <TetrisBackground />

      <button
        type="button"
        onClick={handleBack}
        aria-label="Back"
        className="absolute left-6 top-6 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={16} />
      </button>

      <div className="relative z-10 flex h-full w-full items-center justify-center px-6 py-10">
        <AnimatePresence mode="wait" initial={false} custom={direction}>

          {screen === 'templates' && (
            <motion.div
              key="templates"
              custom={direction}
              {...panelMotionProps}
              className="flex w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] backdrop-blur-md"
              style={{ maxHeight: 'min(580px, calc(100vh - 80px))' }}
            >
              <div className="flex-shrink-0 px-6 pt-6 pb-4 text-center">
                <div
                  className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                  style={{
                    background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)',
                    color: 'var(--accent-base)',
                  }}
                >
                  <Atom size={20} />
                </div>
                <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                  Create a new soul
                </h2>
                <p className="home-ui-font mt-1 text-[14px] text-[var(--text-secondary)]">
                  Pick a personality template or start from scratch.
                </p>
              </div>

              <div
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 no-scrollbar"
                onKeyDown={e => {
                  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    const buttons = e.currentTarget.querySelectorAll('button')
                    const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)
                    const next = e.key === 'ArrowDown' ? idx + 1 : idx - 1
                    const target = buttons[Math.max(0, Math.min(next, buttons.length - 1))]
                    target?.focus()
                    target?.scrollIntoView({ block: 'nearest' })
                  }
                }}
              >
                <TemplateSectionLabel>My Own</TemplateSectionLabel>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(null)}
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-xl border border-dashed border-[var(--border-subtle)]',
                    'px-3 py-2.5 text-left outline-none',
                    'transition-all duration-150',
                    'hover:border-[var(--accent-base)]/20 hover:bg-[var(--surface-2)]',
                    'focus-visible:border-[var(--accent-base)]/40 focus-visible:bg-[var(--surface-2)]',
                  )}
                >
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="home-ui-font block truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                      Custom Soul
                    </span>
                    <span className="home-ui-font block truncate text-[14px] text-[var(--text-secondary)]">
                      Start with a blank configuration
                    </span>
                  </span>
                  <CaretRightSmall
                    size={14}
                    className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[var(--text-secondary)]"
                  />
                </button>

                {(() => {
                  const categoryMap = new Map<string, SoulTemplate[]>()
                  for (const t of SOUL_TEMPLATES) {
                    const list = categoryMap.get(t.category) ?? []
                    list.push(t)
                    categoryMap.set(t.category, list)
                  }
                  return Array.from(categoryMap.entries()).map(([category, items]) => (
                    <div key={category}>
                      <TemplateSectionLabel>{category}</TemplateSectionLabel>
                      {items.map(tmpl => (
                        <TemplateListItem
                          key={tmpl.id}
                          template={tmpl}
                          onSelect={() => handleSelectTemplate(tmpl)}
                        />
                      ))}
                    </div>
                  ))
                })()}
              </div>
            </motion.div>
          )}

          {screen === 'steps' && (
            <motion.div
              key="steps"
              layout
              custom={direction}
              {...panelMotionProps}
              className={cn(
                'rounded-2xl border bg-[var(--surface-1)]/90 backdrop-blur-md transition-shadow duration-300',
                personalityOpen
                  ? 'w-full max-w-[680px] border-[color-mix(in_srgb,var(--accent-base)_30%,var(--border-subtle))] shadow-[0_24px_80px_-16px_color-mix(in_srgb,var(--accent-base)_25%,transparent)]'
                  : 'w-full max-w-[560px] border-[var(--border-subtle)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]',
              )}
            >
              <AnimatePresence mode="wait" initial={false}>
                {personalityOpen ? (
                  <motion.div
                    key="personality-workspace"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    className="max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar p-6"
                  >
                    <PersonalityWorkspace
                      personality={personalityConfig}
                      onChange={handlePersonalityChange}
                      onClose={handlePersonalityClose}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="steps-list"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    className="p-6"
                  >
                    <div className="mb-4 flex flex-col items-center text-center">
                      <div
                        className="mb-3 flex h-11 w-11 items-center justify-center rounded-full"
                        style={{
                          background: 'color-mix(in srgb, var(--accent-base) 22%, transparent)',
                          color: 'var(--accent-base)',
                        }}
                      >
                        <Atom size={20} />
                      </div>
                      <h2 className="home-heading-font text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                        Configure your soul
                      </h2>
                      {selectedTemplate && (
                        <p className="home-ui-font mt-1 text-[14px] text-[var(--text-secondary)]">
                          Based on <span className="font-semibold text-[var(--text-primary)]">
                            {SOUL_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                          </span> template
                        </p>
                      )}
                    </div>

                    <ul className="flex flex-col gap-1.5">
                      {STEPS.map((step, idx) => {
                        const selection = stepSelections[step.id]
                        const isPersonalityDone = step.id === 'personality' && personalityConfigured
                        const isChannelsDone = step.id === 'channels' && channelsSelected.length > 0
                        const showCheck = selection != null || isPersonalityDone || isChannelsDone
                        const subtitle = step.id === 'channels' && channelsSelected.length > 0
                          ? 'Discord'
                          : step.id === 'personality' && personalityConfigured
                            ? (personalityConfig.presetId
                                ? personalityConfig.presetId.charAt(0).toUpperCase() + personalityConfig.presetId.slice(1)
                                : 'Custom')
                            : (selection?.name ?? step.subtitle)
                        return (
                          <motion.li
                            key={step.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.025, ease: 'easeOut' }}
                          >
                            <button
                              type="button"
                              onClick={() => handleStepClick(step.id)}
                              className="group flex w-full items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 px-3.5 py-2.5 text-left transition-colors hover:border-[var(--accent-base)]/50 hover:bg-[var(--surface-2)]"
                            >
                              <span
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                                style={{
                                  background: 'color-mix(in srgb, var(--accent-base) 16%, transparent)',
                                  color: 'var(--accent-base)',
                                }}
                              >
                                {step.icon}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="home-ui-font block truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                                  {step.title}
                                </span>
                                <span className="home-ui-font block truncate text-[14px] text-[var(--text-secondary)]">
                                  {subtitle}
                                </span>
                              </span>
                              {showCheck ? (
                                <span
                                  className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                                  style={{ background: 'var(--accent-base)' }}
                                >
                                  <svg viewBox="0 0 10 8" fill="none" className="h-2.5 w-2.5" aria-hidden>
                                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              ) : (
                                <CaretRightSmall size={14} className="flex-shrink-0 text-[var(--text-tertiary)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--text-secondary)]" />
                              )}
                            </button>
                          </motion.li>
                        )
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {screen === 'llm' && (
            <motion.div key="llm" custom={direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardProviderPanel
                title="Select LLM"
                subtitle="Choose the language model that will power your soul."
                icon={<Atom size={20} />}
                panelType="llm"
                items={llmItems}
                selectedId={stepSelections.llm?.id ?? null}
                initialConfig={stepSelections.llm?.config}
                onSelect={(id, name, config) => handleProviderSelect('llm', id, name, config)}
              />
            </motion.div>
          )}

          {screen === 'tts' && (
            <motion.div key="tts" custom={direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardProviderPanel
                title="Select Voice"
                subtitle="Choose the text-to-speech engine for your soul's voice."
                icon={<Microphone size={20} />}
                panelType="tts"
                items={ttsItems}
                selectedId={stepSelections.tts?.id ?? null}
                initialConfig={stepSelections.tts?.config}
                onSelect={(id, name, config) => handleProviderSelect('tts', id, name, config)}
              />
            </motion.div>
          )}

          {screen === 'channels' && (
            <motion.div key="channels" custom={direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardChannelsPanel
                initialBotToken={stepSelections.channels?.config?.botToken}
                onConfirm={(config) => {
                  setChannelsSelected(['discord'])
                  saveWithTTL('v1_inktide_wizard_channels', ['discord'])
                  if (config?.botToken) {
                    const updated = { ...stepSelections, channels: { id: 'discord', name: 'Discord', config: { botToken: config.botToken } } }
                    setStepSelections(updated)
                    saveWithTTL('v1_inktide_wizard_selections', updated)
                  }
                  navigate('steps', -1)
                }}
              />
            </motion.div>
          )}

          {screen === 'finish' && (
            <motion.div key="finish" custom={direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardFinishPanel
                llmName={stepSelections.llm?.name ?? null}
                ttsName={stepSelections.tts?.name ?? null}
                hasDiscord={channelsSelected.length > 0}
                onConfirm={async (name) => {
                  const char = buildCharacter(name)
                  const botToken = stepSelections.channels?.config?.botToken as string | undefined
                  await onFinish?.(char, botToken)
                  clearWizardDraft()
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
