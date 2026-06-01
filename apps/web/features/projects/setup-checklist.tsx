'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import type { TemplateNextStep } from '@/shared/data/project-templates'
import type { Project } from '@/entities/project/api'

const CHECKLIST_KEY = (id: string) => `project_setup_${id}`
const DISMISSED_KEY = (id: string) => `project_setup_${id}_dismissed`

interface SetupChecklistProps {
  project: Project
  channelCount: number
}

export function SetupChecklist({ project, channelCount }: SetupChecklistProps) {
  const { t } = useTranslation('common')
  const [steps, setSteps] = useState<TemplateNextStep[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISSED_KEY(project.id)) === '1') {
      setDismissed(true)
      return
    }
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY(project.id))
      if (raw) {
        setSteps(JSON.parse(raw))
        setVisible(true)
      }
    } catch { /* ignore */ }
  }, [project.id])

  const isDone = useMemo(
    () =>
      (step: TemplateNextStep): boolean => {
        switch (step.doneWhen) {
          case 'soul':    return !!project.active_soul_id
          case 'channel': return channelCount > 0
          case 'model':   return !!project.active_model_id
          case 'scene':   return !!project.active_scene_id
          case 'never':   return false
          default:        return false
        }
      },
    [project, channelCount],
  )

  const allRequiredDone = steps.filter(s => s.required).every(isDone)
  const doneCount = steps.filter(isDone).length

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY(project.id), '1')
    setDismissed(true)
  }

  // Auto-dismiss 3s after all required steps complete
  useEffect(() => {
    if (!allRequiredDone || steps.length === 0) return
    const timer = setTimeout(dismiss, 3000)
    return () => clearTimeout(timer)
  }, [allRequiredDone, steps.length])

  if (dismissed || !visible || steps.length === 0) return null

  return (
    <motion.div
      className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{allRequiredDone ? '✅' : '🚀'}</span>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {allRequiredDone ? t('setup.titleDone') : t('setup.title')}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {t('setup.progress', { done: doneCount, total: steps.length })}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-[var(--border-subtle)]">
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-[var(--border-subtle)]">
        {steps.map(step => {
          const done = isDone(step)
          const href = step.hrefTemplate
            .replace('{soulId}', project.active_soul_id ?? '')
            .replace('{projectId}', project.id)

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 px-5 py-3.5 transition-opacity ${done ? 'opacity-60' : ''}`}
            >
              {done ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
              ) : (
                <Circle size={18} className="mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium ${
                    done ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {step.label}
                </p>
                {!done && (
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{step.description}</p>
                )}
              </div>
              {!done && href && (
                <Link
                  href={href}
                  className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--accent-primary)] hover:underline"
                >
                  {t('setup.link')} <ChevronRight size={12} />
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
