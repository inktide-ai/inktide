'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Atom, Microphone } from '@/shared/ui/icons'
import { LLM_PROVIDER_CATALOG } from '@/shared/data/llm-provider-catalog'
import { VOICE_PROVIDER_CATALOG } from '@/shared/data/voice-providers'
import { TetrisBackground } from '../tetris-background'
import { createDefaultCharacter } from '@/shared/lib/character/defaults'
import type { AiCharacter } from '@/shared/lib/character/types'
import { SOUL_TEMPLATES } from '@/shared/data/soul-templates'
import type { WizardProviderItem } from './wizard-provider-card'
import { WizardProviderPanel } from './wizard-provider-panel'
import { WizardChannelsPanel } from './wizard-channels-panel'
import { WizardFinishPanel } from './wizard-finish-panel'
import { useWizardState } from './useWizardState'
import { WizardTemplatesScreen } from './wizard-templates-screen'
import { WizardStepsScreen } from './wizard-steps-screen'

const panelMotionProps = {
  variants: {
    enter: (d: number) => ({ opacity: 0, x: d * 24 }),
    center: { opacity: 1, x: 0 },
    exit:  (d: number) => ({ opacity: 0, x: d * -24 }),
  },
  initial: 'enter' as const,
  animate: 'center' as const,
  exit: 'exit' as const,
  transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const },
}

export interface SoulCreationWizardProps {
  onBack: () => void
  onFinish?: (character: Omit<AiCharacter, 'id'>, discordBotToken?: string) => Promise<string | null>
  onStep?: (stepId: string) => void
  onLlmSelect?: (providerId: string, config?: Record<string, string>) => void
  onTtsSelect?: (providerId: string, config?: Record<string, string>) => void
}

export function SoulCreationWizard({ onBack, onFinish, onStep, onLlmSelect, onTtsSelect }: SoulCreationWizardProps) {
  const { t } = useTranslation('common')
  const wizard = useWizardState()
  const { state, navigate, selectTemplate, selectProvider, setPersonality, openPersonality, closePersonality, confirmChannels, clearDraft } = wizard

  const llmItems = useMemo<WizardProviderItem[]>(() =>
    LLM_PROVIDER_CATALOG.map(p => ({ id: p.id, name: p.name, subtitle: p.model, iconSrc: p.iconSrc, darkIcon: p.darkIcon })),
    [],
  )
  const ttsItems = useMemo<WizardProviderItem[]>(() =>
    VOICE_PROVIDER_CATALOG.map(p => ({ id: p.id, name: p.name, iconSrc: p.iconSrc, darkIcon: p.darkIcon })),
    [],
  )

  const buildCharacter = (name: string): Omit<AiCharacter, 'id'> => {
    const base = createDefaultCharacter()
    const template = SOUL_TEMPLATES.find(t => t.id === state.selectedTemplate)
    return {
      ...base,
      name,
      personality:  template?.personality ?? '',
      systemPrompt: template?.personality ?? base.systemPrompt,
      llm: {
        ...base.llm,
        providerId: state.stepSelections.llm?.id ?? null,
        baseUrl:    state.stepSelections.llm?.config?.baseUrl ?? null,
      },
      tts: {
        ...base.tts,
        providerId: state.stepSelections.tts?.id ?? null,
        apiKey:     state.stepSelections.tts?.config?.apiKey ?? null,
      },
      personalityConfig: state.personalityConfig,
    }
  }

  const handleProviderSelect = (stepId: string, id: string, name: string, config?: Record<string, string>) => {
    selectProvider(stepId, id, name, config)
    if (stepId === 'llm') onLlmSelect?.(id, config)
    if (stepId === 'tts') onTtsSelect?.(id, config)
  }

  const handleStepClick = (stepId: string) => {
    if (stepId === 'llm' || stepId === 'tts') { navigate(stepId as 'llm' | 'tts', 1); return }
    if (stepId === 'channels') { navigate('channels', 1); return }
    if (stepId === 'personality') { openPersonality(); return }
    if (stepId === 'finish') { navigate('finish', 1); return }
    onStep?.(stepId)
  }

  const handleBack = () => {
    if (state.personalityOpen) { closePersonality(); return }
    if (state.screen === 'finish' || state.screen === 'llm' || state.screen === 'tts' || state.screen === 'channels')
      navigate('steps', -1)
    else if (state.screen === 'steps')
      navigate('templates', -1)
    else { clearDraft(); onBack() }
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
        <AnimatePresence mode="wait" initial={false} custom={state.direction}>

          {state.screen === 'templates' && (
            <WizardTemplatesScreen direction={state.direction} onSelect={selectTemplate} />
          )}

          {state.screen === 'steps' && (
            <WizardStepsScreen
              direction={state.direction}
              state={state}
              setPersonality={setPersonality}
              closePersonality={closePersonality}
              onStepClick={handleStepClick}
            />
          )}

          {state.screen === 'llm' && (
            <motion.div key="llm" custom={state.direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardProviderPanel
                title={t('wizard.selectLlm')}
                subtitle={t('wizard.selectLlmDesc')}
                icon={<Atom size={20} />}
                panelType="llm"
                items={llmItems}
                selectedId={state.stepSelections.llm?.id ?? null}
                initialConfig={state.stepSelections.llm?.config}
                onSelect={(id, name, config) => handleProviderSelect('llm', id, name, config)}
              />
            </motion.div>
          )}

          {state.screen === 'tts' && (
            <motion.div key="tts" custom={state.direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardProviderPanel
                title={t('wizard.selectVoice')}
                subtitle={t('wizard.selectVoiceDesc')}
                icon={<Microphone size={20} />}
                panelType="tts"
                items={ttsItems}
                selectedId={state.stepSelections.tts?.id ?? null}
                initialConfig={state.stepSelections.tts?.config}
                onSelect={(id, name, config) => handleProviderSelect('tts', id, name, config)}
              />
            </motion.div>
          )}

          {state.screen === 'channels' && (
            <motion.div key="channels" custom={state.direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardChannelsPanel
                initialBotToken={state.stepSelections.channels?.config?.botToken}
                onConfirm={(config) => {
                  const selections = config?.botToken
                    ? { ...state.stepSelections, channels: { id: 'discord', name: 'Discord', config: { botToken: config.botToken } } }
                    : state.stepSelections // same reference - no spurious persist
                  confirmChannels(['discord'], selections)
                }}
              />
            </motion.div>
          )}

          {state.screen === 'finish' && (
            <motion.div key="finish" custom={state.direction} {...panelMotionProps} className="flex w-full justify-center">
              <WizardFinishPanel
                llmName={state.stepSelections.llm?.name ?? null}
                ttsName={state.stepSelections.tts?.name ?? null}
                hasDiscord={state.channelsSelected.length > 0}
                onConfirm={async (name) => {
                  const char = buildCharacter(name)
                  const botToken = state.stepSelections.channels?.config?.botToken as string | undefined
                  await onFinish?.(char, botToken)
                  clearDraft()
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
