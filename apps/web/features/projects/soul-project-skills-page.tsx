'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, Loader2, Zap } from 'lucide-react'
import { getProject, updateProject, resetProjectSystemPrompt, type Project } from '@/features/projects'
import { DEFAULTS } from '@/shared/lib/character/defaults'
import { handleError } from '@/shared/lib/handle-error'
import { PageContent } from '@/shared/ui'

const MAX_CHARS = 8000

type SaveState  = 'idle' | 'saving'  | 'saved'  | 'error'
type ResetState = 'idle' | 'resetting' | 'reset'

export default function SoulProjectSkillsPage() {
  const { projectId } = useParams<{ id: string; projectId: string }>()

  const [project, setProject]       = useState<Project | null>(null)
  const [prompt, setPrompt]         = useState<string>(DEFAULTS.systemPrompt)
  const [loading, setLoading]       = useState(true)
  const [saveState, setSaveState]   = useState<SaveState>('idle')
  const [resetState, setResetState] = useState<ResetState>('idle')
  const savedTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resetTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getProject(projectId)
      .then(p => {
        setProject(p)
        // null = using backend default - show it so user can see what the AI uses
        setPrompt(p.system_prompt ?? DEFAULTS.systemPrompt)
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current)
    if (resetTimer.current) clearTimeout(resetTimer.current)
  }, [])

  const isUsingDefault = project?.system_prompt === null

  async function handleSave() {
    if (!project || saveState === 'saving') return
    setSaveState('saving')
    try {
      // If user left the default text untouched, keep null in DB (don't override with literal string)
      const systemPromptPayload = isUsingDefault && prompt === DEFAULTS.systemPrompt
        ? null
        : prompt.trim() || null

      const updated = await updateProject(projectId, {
        name:          project.name,
        description:   project.description,
        system_prompt: systemPromptPayload,
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

  async function handleReset() {
    if (!project || resetState === 'resetting') return
    setResetState('resetting')
    try {
      await resetProjectSystemPrompt(projectId)
      setProject(p => p ? { ...p, system_prompt: null } : null)
      setPrompt(DEFAULTS.systemPrompt)
      setResetState('reset')
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setResetState('idle'), 2000)
    } catch {
      setResetState('idle')
    }
  }

  // Dirty when: on default - text was modified; on custom - text differs from saved
  const isDirty = project !== null && (
    isUsingDefault
      ? prompt !== DEFAULTS.systemPrompt
      : prompt !== (project.system_prompt ?? '')
  )

  // Can reset only when there's a custom prompt saved in DB
  const canReset = project !== null && !isUsingDefault

  const showingDefault = isUsingDefault && prompt === DEFAULTS.systemPrompt

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  return (
    <PageContent>

      <header className="mb-7 flex flex-col gap-2">
        <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">Skills</h2>
        <span className="text-body text-balance text-[var(--text-secondary)]">Project-level behaviour overrides. Changes apply after the context cache refreshes (~5 min).</span>
      </header>

      <div className="overflow-hidden rounded-xl border border-[var(--border-card)]">

        {/* card header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2 text-body font-medium text-[var(--text-primary)]">
            <Zap size={14} className="text-[var(--text-tertiary)]" />
            System Prompt
            {showingDefault && (
              <span className="ml-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
                default
              </span>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 md:flex-row">
            <button
              type="button"
              disabled={!canReset || resetState === 'resetting'}
              onClick={handleReset}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md border border-[var(--border-subtle)] bg-transparent px-4 text-body font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-subtle)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {resetState === 'resetting' && <Loader2 size={13} className="animate-spin mr-1.5" />}
              {resetState === 'reset'     && <Check   size={13} className="mr-1.5" />}
              {resetState === 'resetting' ? 'Resetting…' : resetState === 'reset' ? 'Cleared' : 'Reset'}
            </button>
            <button
              type="button"
              disabled={!isDirty || saveState === 'saving'}
              onClick={handleSave}
              className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-md bg-[var(--text-primary)] px-4 text-body font-medium text-[var(--bg-0)] transition-opacity hover:opacity-90 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saveState === 'saving' && <Loader2 size={13} className="animate-spin mr-1.5" />}
              {saveState === 'saved'  && <Check   size={13} className="mr-1.5" />}
              {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Error — retry' : 'Save'}
            </button>
          </div>
        </div>

        {/* card body */}
        <div className="bg-[var(--bg-0)] px-5 py-4">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            rows={14}
            placeholder={DEFAULTS.systemPrompt}
            className={`w-full resize-y rounded-xl border px-4 py-3 font-mono text-body leading-relaxed outline-none transition-colors
              ${showingDefault
                ? 'border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-secondary)] focus:border-[var(--border-strong)]'
                : 'border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--accent-primary)]'
              }`}
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-[var(--text-tertiary)]">
              {showingDefault
                ? 'Using system default · edit to create a project override'
                : isDirty
                  ? 'Unsaved changes'
                  : 'Project override active'}
            </span>
            <span className={`text-xs tabular-nums ${prompt.length >= MAX_CHARS ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`}>
              {prompt.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

    </PageContent>
  )
}
