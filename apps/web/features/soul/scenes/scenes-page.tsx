'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import {
  listRunPresets,
  createRunPreset,
  updateRunPreset,
  deleteRunPreset,
  activateRunPreset,
  deactivateRunPreset,
  getCatalogLlmModels,
  getCatalogTtsVoices,
  type RunPreset,
  type CreateRunPresetRequest,
  type LlmModelResponse,
  type TtsVoiceResponse,
} from '@/features/soul/api/index'
import { RunPresetCard } from './run-preset-card'
import { CreatePresetModal } from './create-preset-modal'

export function ScenesPage() {
  const { selected } = useCharactersContext()
  const cardId = selected?.id

  const [presets, setPresets] = useState<RunPreset[]>([])
  const [llmModels, setLlmModels] = useState<LlmModelResponse[]>([])
  const [ttsVoices, setTtsVoices] = useState<TtsVoiceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RunPreset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RunPreset | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const activePreset = presets.find(p => p.is_active) ?? null

  const load = useCallback(async () => {
    if (!cardId) return
    setLoading(true)
    setError(null)
    try {
      const [list, models, voices] = await Promise.all([
        listRunPresets(cardId),
        getCatalogLlmModels(),
        getCatalogTtsVoices(),
      ])
      setPresets(list)
      setLlmModels(models)
      setTtsVoices(voices)
    } catch {
      setError('Failed to load scenes.')
    } finally {
      setLoading(false)
    }
  }, [cardId])

  useEffect(() => { load() }, [load])

  const handleCreate = async (body: CreateRunPresetRequest) => {
    if (!cardId) return
    setMutationError(null)
    try {
      const preset = await createRunPreset(cardId, body)
      setPresets(prev => [preset, ...prev])
    } catch {
      setMutationError('Failed to save scene.')
    }
  }

  const handleUpdate = async (body: CreateRunPresetRequest) => {
    if (!cardId || !editing) return
    setMutationError(null)
    try {
      const preset = await updateRunPreset(cardId, editing.id, { ...body, name: body.name })
      setPresets(prev => prev.map(p => p.id === preset.id ? preset : p))
      setEditing(null) // close only on success — draft preserved for retry on failure
    } catch {
      setMutationError('Failed to update scene.')
    }
  }

  const handleActivate = async (id: string) => {
    if (!cardId) return
    setMutationError(null)
    try {
      const activated = await activateRunPreset(cardId, id)
      setPresets(prev => prev.map(p => ({
        ...p,
        is_active: p.id === activated.id,
      })))
    } catch {
      setMutationError('Failed to activate scene.')
    }
  }

  const handleDeactivate = async () => {
    if (!cardId) return
    setMutationError(null)
    try {
      await deactivateRunPreset(cardId)
      setPresets(prev => prev.map(p => ({ ...p, is_active: false })))
    } catch {
      setMutationError('Failed to deactivate scene.')
    }
  }

  const handleDelete = async () => {
    if (!cardId || !deleteTarget) return
    setDeleteError(null)
    try {
      await deleteRunPreset(cardId, deleteTarget.id)
      setPresets(prev => prev.filter(p => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setDeleteError('Delete failed.')
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-6 px-6 py-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="home-heading-font text-[20px] font-semibold text-[var(--text-heading)]">
            Runtime Scenes
          </h1>
          <p className="home-ui-font mt-1 text-[14px] text-[var(--text-tertiary)]">
            Named configuration presets that override soul defaults at runtime — without changing the base config.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-[var(--accent-base)] px-3 py-2 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Create Scene
        </button>
      </div>

      {/* Active scene banner */}
      <AnimatePresence mode="wait">
        {activePreset ? (
          <motion.div
            key={activePreset.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-3 rounded-[12px] border border-[var(--accent-base)] bg-[color-mix(in_srgb,var(--accent-base)_8%,var(--surface-panel))] px-4 py-3"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent-base)]" />
            <div className="flex items-center gap-2">
              {activePreset.icon && <span className="text-[16px]">{activePreset.icon}</span>}
              <span className="home-ui-font text-[14px] font-semibold text-[var(--text-primary)]">
                {activePreset.name}
              </span>
              <span className="home-ui-font text-[14px] text-[var(--text-tertiary)]">is active</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="defaults"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-[12px] border border-[var(--border-card)] bg-[var(--surface-0)] px-4 py-3"
          >
            <span className="h-2 w-2 rounded-full bg-[var(--text-tertiary)]" />
            <span className="home-ui-font text-[14px] text-[var(--text-tertiary)]">Running on soul defaults</span>
          </motion.div>
        )}
      </AnimatePresence>

      {mutationError && (
        <p className="home-ui-font text-[14px] text-red-400">{mutationError}</p>
      )}

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center">
          <p className="home-ui-font text-[14px] text-[var(--text-tertiary)]">Loading scenes…</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="home-ui-font text-[14px] text-red-400">{error}</p>
        </div>
      ) : presets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 rounded-[16px] border border-dashed border-[var(--border-card)] py-16 text-center"
        >
          <div className="text-[40px] leading-none select-none">🎬</div>
          <div>
            <p className="home-heading-font text-[15px] font-semibold text-[var(--text-primary)]">No runtime scenes yet</p>
            <p className="home-ui-font mt-1 max-w-xs text-[14px] text-[var(--text-tertiary)]">
              Create a scene to switch your soul&apos;s model, temperature, or voice at runtime.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[var(--accent-base)] px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            Create Scene
          </button>
        </motion.div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map(preset => (
              <RunPresetCard
                key={preset.id}
                preset={preset}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                onEdit={p => { setEditing(p); setModalOpen(true) }}
                onDelete={p => setDeleteTarget(p)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Create / Edit modal */}
      <CreatePresetModal
        open={modalOpen}
        editing={editing}
        llmModels={llmModels}
        ttsVoices={ttsVoices}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-x-0 top-1/3 z-50 mx-auto w-full max-w-sm rounded-[14px] border border-[var(--border-card)] bg-[var(--surface-panel)] p-5 shadow-2xl"
            >
              <h3 className="home-heading-font mb-1 text-[15px] font-semibold text-[var(--text-heading)]">
                Delete scene?
              </h3>
              <p className="home-ui-font text-[14px] text-[var(--text-secondary)]">
                &ldquo;{deleteTarget.name}&rdquo; will be permanently removed.
              </p>
              {deleteError && (
                <p className="mt-2 text-[14px] text-red-400">{deleteError}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setDeleteTarget(null); setDeleteError(null) }}
                  className="rounded-md border border-[var(--border-card)] px-4 py-2 text-[14px] text-[var(--text-secondary)] hover:border-[var(--border-divider)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-md bg-red-500 px-4 py-2 text-[14px] font-semibold text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
