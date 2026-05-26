'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ChevronDown, X } from 'lucide-react'
import { createProject } from '@/entities/project/api'
import type { AiCardListItem } from '@/entities/soul/api'
import { TetrisAssemble } from './tetris-assemble'

interface ProjectCreationWizardProps {
  onClose: () => void
  onCreated: (id: string) => void
  defaultSoulId?: string
  defaultSoulName?: string
  souls?: AiCardListItem[]
}

export function ProjectCreationWizard({ onClose, onCreated, defaultSoulId, defaultSoulName, souls = [] }: ProjectCreationWizardProps) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating]       = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [soulOpen, setSoulOpen]       = useState(false)
  const [selectedSoulId, setSelectedSoulId]     = useState<string | undefined>(defaultSoulId)
  const [selectedSoulName, setSelectedSoulName] = useState<string | undefined>(defaultSoulName)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const soulLocked = Boolean(defaultSoulId)

  // Auto-select if there's exactly one soul
  useEffect(() => {
    if (!selectedSoulId && souls.length === 1) {
      setSelectedSoulId(souls[0].id)
      setSelectedSoulName(souls[0].name)
    }
  }, [souls, selectedSoulId])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !selectedSoulId || creating) return
    setCreating(true)
    setError(null)
    try {
      const project = await createProject({ name: name.trim(), description: description.trim() || undefined, active_soul_id: selectedSoulId })
      onCreated(project.id)
    } catch {
      setError('Failed to create project. Please try again.')
      setCreating(false)
    }
  }

  function selectSoul(soul: AiCardListItem) {
    setSelectedSoulId(soul.id)
    setSelectedSoulName(soul.name)
    setSoulOpen(false)
  }


  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Dark background */}
      <div className="absolute inset-0 bg-[var(--bg-0)]" />

      {/* Tetris assembly animation */}
      <TetrisAssemble />

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.8)] text-[var(--text-secondary)] backdrop-blur-sm hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={16} />
      </button>

      {/* Center card */}
      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_0.92)] p-8 shadow-2xl backdrop-blur-md">
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-primary)]">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">New Project</h2>
          <p className="mt-1.5 text-[14px] text-[var(--text-secondary)]">
            A project owns channels, memory, and pipeline config.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Soul selector */}
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-[var(--text-secondary)]">
              Soul <span className="text-[var(--accent-primary)]">*</span>
            </label>

            {soulLocked ? (
              /* Pre-selected from overview — show locked badge */
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5">
                {souls.find(s => s.id === selectedSoulId)?.avatar_url ? (
                  <img src={souls.find(s => s.id === selectedSoulId)!.avatar_url!} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                )}
                <span className="text-[14px] text-[var(--text-primary)]">{selectedSoulName}</span>
                <span className="ml-auto text-[12px] text-[var(--text-tertiary)]">from overview</span>
              </div>
            ) : souls.length === 0 ? (
              /* No souls — CTA to create one */
              <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-[14px]">
                <span className="text-[var(--text-tertiary)]">No souls yet</span>
                <Link href="/souls" onClick={onClose} className="text-[var(--accent-primary)] hover:underline">
                  Create your first Soul →
                </Link>
              </div>
            ) : (
              /* Picker */
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setSoulOpen(v => !v)}
                  className="flex w-full items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-[14px] transition-colors hover:border-[var(--accent-primary)] focus:outline-none"
                >
                  {selectedSoulId ? (
                    <>
                      {souls.find(s => s.id === selectedSoulId)?.avatar_url ? (
                        <img src={souls.find(s => s.id === selectedSoulId)!.avatar_url!} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      )}
                      <span className="text-[var(--text-primary)]">{selectedSoulName}</span>
                      <ChevronDown size={14} className={`ml-auto text-[var(--text-tertiary)] transition-transform ${soulOpen ? 'rotate-180' : ''}`} />
                    </>
                  ) : (
                    <>
                      <span className="text-[var(--text-tertiary)]">Select a soul…</span>
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
                            className={`flex w-full items-center gap-2.5 px-3 py-2 text-[14px] transition-colors hover:bg-[var(--surface-1)] ${soul.id === selectedSoulId ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
                          >
                            {soul.avatar_url ? (
                              <img src={soul.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-2)] text-[10px] font-semibold uppercase text-[var(--text-secondary)]">
                                {soul.name[0]}
                              </span>
                            )}
                            <span>{soul.name}</span>
                            {soul.status !== 'active' && (
                              <span className="ml-auto text-[12px] capitalize text-[var(--text-tertiary)]">{soul.status}</span>
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

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-[var(--text-secondary)]">
              Project name <span className="text-[var(--accent-primary)]">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Twitch Project"
              maxLength={80}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-[14px] font-medium text-[var(--text-secondary)]">
              Description <span className="text-[var(--text-tertiary)]">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What is this project for?"
              rows={2}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-0)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-[14px] text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || !selectedSoulId || creating}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] text-[14px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : (
              'Create Project'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  )
}
