'use client'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import { Atom, CaretRightSmall } from '@/shared/ui/icons'
import { SOUL_TEMPLATES } from '@/shared/data/soul-templates'
import { cn } from '@/lib/utils'
import { PersonalityWorkspace } from '../personality-workspace'
import { STEPS } from './wizard-steps'
import type { WizardState } from './useWizardState'
import type { CharacterPersonality } from '@/shared/lib/character'

const screenVariants = {
  enter: (d: number) => ({ opacity: 0, x: d * 24 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d * -24 }),
}
const panelTransition = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const }

interface Props {
  direction: 1 | -1
  state: WizardState
  setPersonality: (config: CharacterPersonality) => void
  closePersonality: () => void
  onStepClick: (stepId: string) => void
}

export function WizardStepsScreen({ direction, state, setPersonality, closePersonality, onStepClick }: Props) {
  const { t } = useTranslation('common')
  return (
    <motion.div
      key="steps"
      layout
      custom={direction}
      variants={screenVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={panelTransition}
      className={cn(
        'rounded-2xl border bg-[var(--surface-1)]/90 backdrop-blur-md transition-shadow duration-300',
        state.personalityOpen
          ? 'w-full max-w-[680px] border-[color-mix(in_srgb,var(--accent-base)_30%,var(--border-subtle))] shadow-[0_24px_80px_-16px_color-mix(in_srgb,var(--accent-base)_25%,transparent)]'
          : 'w-full max-w-[560px] border-[var(--border-subtle)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)]',
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state.personalityOpen ? (
          <motion.div
            key="personality-workspace"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-h-[calc(100vh-100px)] overflow-y-auto no-scrollbar p-6"
          >
            <PersonalityWorkspace
              personality={state.personalityConfig}
              onChange={setPersonality}
              onClose={closePersonality}
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
                {t('wizard.configureSoul')}
              </h2>
              {state.selectedTemplate && (
                <p className="home-ui-font mt-1 text-body text-[var(--text-secondary)]">
                  {t('wizard.basedOnTemplate', { name: SOUL_TEMPLATES.find(tmpl => tmpl.id === state.selectedTemplate)?.name })}
                </p>
              )}
            </div>

            <ul className="flex flex-col gap-1.5">
              {STEPS.map((step, idx) => {
                const selection = state.stepSelections[step.id]
                const isPersonalityDone = step.id === 'personality' && state.personalityConfigured
                const isChannelsDone = step.id === 'channels' && state.channelsSelected.length > 0
                const showCheck = selection != null || isPersonalityDone || isChannelsDone
                const subtitle = step.id === 'channels' && state.channelsSelected.length > 0
                  ? 'Discord'
                  : step.id === 'personality' && state.personalityConfigured
                    ? (state.personalityConfig.presetId
                        ? state.personalityConfig.presetId.charAt(0).toUpperCase() + state.personalityConfig.presetId.slice(1)
                        : t('wizard.myOwn'))
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
                      onClick={() => onStepClick(step.id)}
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
                        <span className="home-ui-font block truncate text-body text-[var(--text-secondary)]">
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
  )
}
