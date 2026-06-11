'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { createProject } from '@/entities/project/api'
import { updateProject, deleteProject } from '@/features/projects/api'
import type { AiCardListItem } from '@/entities/soul/api'
import type { AnyProjectTemplate } from '@/shared/data/project-templates'
import { queryKeys } from '@/shared/lib/query/keys'
import { SOULS_ROUTE } from '@/lib/routes'
import { TetrisAssemble } from './tetris-assemble'

const CHECKLIST_KEY = (projectId: string) => `project_setup_${projectId}`

interface ProjectTemplateWizardProps {
  template: AnyProjectTemplate
  souls: AiCardListItem[]
  onClose: () => void
  onCreated: (projectId: string) => void
}

type FormValues = {
  name: string
  description?: string
  soulId?: string
}

export function ProjectTemplateWizard({ template, souls, onClose, onCreated }: ProjectTemplateWizardProps) {
  const { t } = useTranslation('common')
  const schema = useMemo(() => z.object({
    name: z.string().min(1, t('projectWizard.errorNameRequired')).max(80),
    description: z.string().max(300).optional(),
    soulId: z.string().optional(),
  }), [t])
  const queryClient = useQueryClient()
  const [soulOpen, setSoulOpen] = useState(false)
  const [selectedSoulName, setSelectedSoulName] = useState<string | undefined>(
    souls.length === 1 ? souls[0]?.name : undefined,
  )
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isBlank = template.id === 'blank'

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: {
      name: template.defaultName,
      description: '',
      soulId: souls.length === 1 ? souls[0]?.id : undefined,
    },
  })

  const soulId = watch('soulId')

  useEffect(() => {
    if (!soulId && souls.length === 1) {
      setValue('soulId', souls[0]?.id)
      setSelectedSoulName(souls[0]?.name)
    }
  }, [souls]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!soulOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSoulOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [soulOpen])

  function selectSoul(soul: AiCardListItem) {
    setValue('soulId', soul.id)
    setSelectedSoulName(soul.name)
    setSoulOpen(false)
  }

  function clearSoul() {
    setValue('soulId', undefined)
    setSelectedSoulName(undefined)
    setSoulOpen(false)
  }

  const onSubmit = async (data: FormValues) => {
    let createdProjectId: string | null = null
    try {
      const project = await createProject({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        active_soul_id: data.soulId,
      })
      createdProjectId = project.id

      if (template.systemPrompt) {
        await updateProject(project.id, {
          name: data.name.trim(),
          description: data.description?.trim() || undefined,
          system_prompt: template.systemPrompt,
        })
      }

      if (template.nextSteps.length > 0) {
        localStorage.setItem(CHECKLIST_KEY(project.id), JSON.stringify(template.nextSteps))
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
      onCreated(project.id)
    } catch {
      if (createdProjectId) {
        deleteProject(createdProjectId).catch(() => {})
      }
      setError('root', { message: t('projectWizard.errorCreate') })
    }
  }

  const selectedSoul = souls.find(s => s.id === soulId)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="absolute inset-0 bg-[var(--bg-0)]" />
      <TetrisAssemble />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.8)] text-[var(--text-secondary)] backdrop-blur-sm transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.92)] p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-7 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
            style={{ background: `color-mix(in srgb, ${template.accentColor} 20%, transparent)` }}
          >
            {template.emoji}
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {template.name}
          </h2>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{template.description}</p>
          {template.features.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {template.features.slice(0, 3).map(f => (
                <span
                  key={f}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    color: template.accentColor,
                    background: `color-mix(in srgb, ${template.accentColor} 15%, transparent)`,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Soul selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              {t('projectWizard.soul')} <span className="font-normal text-[var(--text-tertiary)]">{t('projectWizard.optional')}</span>
            </label>

            {souls.length === 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm">
                <span className="text-[var(--text-tertiary)]">{t('projectWizard.noSouls')}</span>
                <Link href={SOULS_ROUTE} onClick={onClose} className="text-[var(--accent-primary)] hover:underline">
                  {t('projectWizard.createFirstSoul')}
                </Link>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setSoulOpen(v => !v)}
                  className="flex w-full items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm transition-colors hover:border-[var(--accent-primary)] focus:outline-none"
                >
                  {soulId ? (
                    <>
                      {selectedSoul?.avatar_url ? (
                        <img src={selectedSoul.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                      )}
                      <span className="text-[var(--text-primary)]">{selectedSoulName}</span>
                    </>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">{t('projectWizard.selectSoul')} {t('projectWizard.optional')}</span>
                  )}
                  <ChevronDown
                    size={14}
                    className={`ml-auto text-[var(--text-tertiary)] transition-transform ${soulOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {soulOpen && (
                    <motion.ul
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.13 }}
                      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.98)] py-1 shadow-xl backdrop-blur-md"
                    >
                      {soulId && (
                        <li>
                          <button
                            type="button"
                            onClick={clearSoul}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)]"
                          >
                            <span className="text-xs">✕</span>
                            <span>None (add later)</span>
                          </button>
                        </li>
                      )}
                      {souls.map(soul => (
                        <li key={soul.id}>
                          <button
                            type="button"
                            onClick={() => selectSoul(soul)}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-1)] ${
                              soul.id === soulId ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {soul.avatar_url ? (
                              <img src={soul.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-2)] text-xs font-semibold uppercase text-[var(--text-secondary)]">
                                {soul.name[0]}
                              </span>
                            )}
                            <span>{soul.name}</span>
                            {soul.status !== 'active' && (
                              <span className="ml-auto text-xs capitalize text-[var(--text-tertiary)]">
                                {soul.status}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Project name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              {t('projectWizard.projectName')} <span className="text-[var(--accent-primary)]">*</span>
            </label>
            <input
              {...register('name')}
              autoFocus={!isBlank}
              type="text"
              placeholder={template.defaultName}
              maxLength={80}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
            {errors.name && <p className="mt-1 text-2xs text-[var(--danger-text)]">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              {t('projectWizard.description')} <span className="font-normal text-[var(--text-tertiary)]">{t('projectWizard.optional')}</span>
            </label>
            <textarea
              {...register('description')}
              placeholder={t('projectWizard.descPlaceholder')}
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* System prompt preview */}
          {template.systemPrompt && (
            <details className="rounded-xl border border-[var(--border-subtle)]">
              <summary className="cursor-pointer px-3.5 py-2.5 text-xs text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)]">
                {t('projectWizard.viewSystemPrompt', { count: template.systemPrompt.length })}
              </summary>
              <pre className="max-h-[180px] overflow-y-auto whitespace-pre-wrap border-t border-[var(--border-subtle)] bg-[var(--bg-0)] p-3.5 font-mono text-xs leading-relaxed text-[var(--text-secondary)]">
                {template.systemPrompt}
              </pre>
            </details>
          )}

          {errors.root && (
            <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {errors.root.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: template.accentColor }}
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('projectWizard.creating')}
              </>
            ) : (
              t('projectWizard.createBtn', { name: isBlank ? t('projectWizard.projectFallback') : template.name })
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
