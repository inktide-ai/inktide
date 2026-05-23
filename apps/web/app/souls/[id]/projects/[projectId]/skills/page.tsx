'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, Loader2, Zap } from 'lucide-react'
import { getProject, updateProject, type Project } from '@/api/projects'

const MAX_CHARS = 8000

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function SoulProjectSkillsPage() {
  const { projectId } = useParams<{ id: string; projectId: string }>()

  const [project, setProject]     = useState<Project | null>(null)
  const [prompt, setPrompt]       = useState('')
  const [loading, setLoading]     = useState(true)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const savedTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getProject(projectId)
      .then(p => {
        setProject(p)
        setPrompt(p.system_prompt ?? '')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleSave() {
    if (!project || saveState === 'saving') return
    setSaveState('saving')
    try {
      const updated = await updateProject(projectId, {
        name:          project.name,
        description:   project.description,
        system_prompt: prompt.trim() || null,
      })
      setProject(updated)
      setPrompt(updated.system_prompt ?? '')
      setSaveState('saved')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('error')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveState('idle'), 3000)
    }
  }

  const isDirty = project !== null && prompt !== (project.system_prompt ?? '')

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">

      {/* ── page header ── */}
      <header className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Skills
        </h1>
        <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
          Project-level behaviour overrides. Changes apply after the context cache refreshes (~5 min).
        </p>
      </header>

      {/* ── system prompt card ── */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-card)]">

        {/* card header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-primary)]">
            <Zap size={14} className="text-[var(--text-tertiary)]" />
            System Prompt
          </div>
          <button
            type="button"
            disabled={!isDirty || saveState === 'saving'}
            onClick={handleSave}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-4 text-[14px] font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-40 transition-opacity"
          >
            {saveState === 'saving' && <Loader2 size={12} className="animate-spin" />}
            {saveState === 'saved'  && <Check size={12} />}
            {saveState === 'saving' ? 'Saving…'
              : saveState === 'saved' ? 'Saved'
              : saveState === 'error' ? 'Error — retry'
              : 'Save'}
          </button>
        </div>

        {/* card body */}
        <div className="bg-[var(--bg-0)] px-5 py-4">
          <p className="mb-3 text-[14px] text-[var(--text-secondary)]">
            Overrides the soul&apos;s default system prompt for this project. Leave empty to use the
            soul&apos;s prompt.
          </p>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, MAX_CHARS))}
            rows={14}
            placeholder="You are a barber named Alex. You are cheerful and always talk about haircuts…"
            className="w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 font-mono text-[14px] leading-relaxed text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)] transition-colors"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-tertiary)]">
              {!project?.system_prompt && !prompt
                ? 'Using soul\'s default system prompt'
                : prompt.trim()
                  ? 'Project system prompt is active'
                  : 'Will fall back to soul\'s system prompt on save'
              }
            </span>
            <span className={`text-[12px] tabular-nums ${prompt.length >= MAX_CHARS ? 'text-amber-400' : 'text-[var(--text-tertiary)]'}`}>
              {prompt.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
