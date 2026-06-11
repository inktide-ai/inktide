'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown, X } from 'lucide-react'
import { createProject } from '@/entities/project/api'
import type { AiCardListItem } from '@/entities/soul/api'
import { SOULS_ROUTE } from '@/lib/routes'
import { TetrisAssemble } from './tetris-assemble'

interface ProjectCreationWizardProps {
  onClose: () => void
  onCreated: (id: string) => void
  defaultSoulId?: string
  defaultSoulName?: string
  souls?: AiCardListItem[]
}

type FormValues = {
  name: string
  description?: string
  soulId: string
}

export function ProjectCreationWizard({ onClose, onCreated, defaultSoulId, defaultSoulName, souls = [] }: ProjectCreationWizardProps) {
  const { t } = useTranslation('common')
  const schema = useMemo(() => z.object({
    name: z.string().min(1, t('projectWizard.errorNameRequired')).max(80),
    description: z.string().max(300).optional(),
    soulId: z.string().min(1, t('projectWizard.errorSelectSoul')),
  }), [t])
  const [soulOpen, setSoulOpen] = useState(false)
  const [selectedSoulName, setSelectedSoulName] = useState<string | undefined>(defaultSoulName)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const soulLocked = Boolean(defaultSoulId)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { name: '', description: '', soulId: defaultSoulId ?? '' },
  })

  const soulId = watch('soulId')

  // Auto-select if there's exactly one soul
  useEffect(() => {
    if (!soulId && souls.length === 1) {
      setValue('soulId', souls[0].id, { shouldValidate: false })
      setSelectedSoulName(souls[0].name)
    }
  }, [souls, soulId, setValue])

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

  const onSubmit = async (data: FormValues) => {
    try {
      const project = await createProject({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        active_soul_id: data.soulId,
      })
      onCreated(project.id)
    } catch {
      setError('root', { message: t('projectWizard.errorCreate') })
    }
  }

  function selectSoul(soul: AiCardListItem) {
    setValue('soulId', soul.id, { shouldValidate: true })
    setSelectedSoulName(soul.name)
    setSoulOpen(false)
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
        className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.8)] text-[var(--text-secondary)] backdrop-blur-sm hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={16} />
      </button>

      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.92)] p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-primary)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">{t('projectWizard.newProject')}</h2>
          <p className="mt-1.5 text-body text-[var(--text-secondary)]">
            {t('projectWizard.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Soul selector */}
          <div>
            <label className="mb-1.5 block text-body font-medium text-[var(--text-secondary)]">
              {t('projectWizard.soul')} <span className="text-[var(--accent-primary)]">*</span>
            </label>

            {soulLocked ? (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5">
                {selectedSoul?.avatar_url ? (
                  <img src={selectedSoul.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                )}
                <span className="text-body text-[var(--text-primary)]">{selectedSoulName}</span>
                <span className="ml-auto text-xs text-[var(--text-tertiary)]">{t('projectWizard.fromOverview')}</span>
              </div>
            ) : souls.length === 0 ? (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-body">
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
                  className="flex w-full items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-body transition-colors hover:border-[var(--accent-primary)] focus:outline-none"
                >
                  {soulId ? (
                    <>
                      {selectedSoul?.avatar_url ? (
                        <img src={selectedSoul.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      )}
                      <span className="text-[var(--text-primary)]">{selectedSoulName}</span>
                      <ChevronDown size={14} className={`ml-auto text-[var(--text-tertiary)] transition-transform ${soulOpen ? 'rotate-180' : ''}`} />
                    </>
                  ) : (
                    <>
                      <span className="text-[var(--text-tertiary)]">{t('projectWizard.selectSoul')}</span>
                      <ChevronDown size={14} className={`ml-auto text-[var(--text-tertiary)] transition-transform ${soulOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
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
                      {souls.map(soul => (
                        <li key={soul.id}>
                          <button
                            type="button"
                            onClick={() => selectSoul(soul)}
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-body transition-colors hover:bg-[var(--surface-1)] ${soul.id === soulId ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
                          >
                            {soul.avatar_url ? (
                              <img src={soul.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-2)] text-2xs font-semibold uppercase text-[var(--text-secondary)]">
                                {soul.name[0]}
                              </span>
                            )}
                            <span>{soul.name}</span>
                            {soul.status !== 'active' && (
                              <span className="ml-auto text-xs capitalize text-[var(--text-tertiary)]">{soul.status}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}
            {errors.soulId && <p className="mt-1 text-2xs text-[var(--danger-text)]">{errors.soulId.message}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-body font-medium text-[var(--text-secondary)]">
              {t('projectWizard.projectName')} <span className="text-[var(--accent-primary)]">*</span>
            </label>
            <input
              {...register('name')}
              autoFocus
              type="text"
              placeholder={t('projectWizard.namePlaceholder')}
              maxLength={80}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-body text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
            {errors.name && <p className="mt-1 text-2xs text-[var(--danger-text)]">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-body font-medium text-[var(--text-secondary)]">
              {t('projectWizard.description')} <span className="text-[var(--text-tertiary)]">{t('projectWizard.optional')}</span>
            </label>
            <textarea
              {...register('description')}
              placeholder={t('projectWizard.descPlaceholder')}
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-body text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </div>

          {errors.root && (
            <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-body text-red-400">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] text-body font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('projectWizard.creating')}
              </>
            ) : (
              t('projectWizard.createProject')
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
