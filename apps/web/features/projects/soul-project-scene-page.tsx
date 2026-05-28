'use client'

import { Check, ImageIcon, Box } from 'lucide-react'
import { useProjectRuntimeContext } from '@/features/projects'

function inferModelLabel(fileName: string): string {
  if (fileName.endsWith('.vrm')) return 'VRM'
  if (fileName.endsWith('.glb')) return 'GLB'
  return 'Model'
}

export default function SoulProjectScenePage() {
  const { project, models, scenes, loading, setActiveModel, setActiveScene } = useProjectRuntimeContext()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  if (!project?.active_soul_id) {
    return (
      <div className="flex h-full items-center justify-center text-body text-[var(--text-tertiary)]">
        Bind a soul to this project first — go to Overview and use the Soul picker.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8">
      <header className="mb-7">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">Scene</h1>
        <p className="mt-1 text-body text-[var(--text-secondary)]">
          Choose which 3D model and background scene to render for this project.
        </p>
      </header>

      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Box size={15} className="text-[var(--text-secondary)]" />
          <h2 className="text-body font-semibold text-[var(--text-primary)]">3D Model</h2>
          {project.active_model_id && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Active</span>
          )}
        </div>

        {models.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
            No models uploaded yet — go to Soul → Avatars to upload one.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {models.map(model => {
              const active = project.active_model_id === model.id
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => setActiveModel(active ? null : model.id)}
                  className={`relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--sidebar-active)]'
                      : 'border-[var(--border-subtle)] bg-[hsla(var(--bg-1),_1)] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-1)]'
                  }`}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-2)]">
                    <Box size={18} className="text-[var(--text-secondary)]" />
                  </div>
                  <div className="min-w-0 w-full pr-6">
                    <p className="truncate text-body font-medium text-[var(--text-primary)]">
                      {model.original_file_name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {inferModelLabel(model.original_file_name)} · {(model.size_bytes / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <ImageIcon size={15} className="text-[var(--text-secondary)]" />
          <h2 className="text-body font-semibold text-[var(--text-primary)]">Background</h2>
          {project.active_scene_id && (
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">Active</span>
          )}
        </div>

        {scenes.length === 0 ? (
          <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-body text-[var(--text-tertiary)]">
            No scenes uploaded yet — go to Soul → Scenes to upload one.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {scenes.map(scene => {
              const active = project.active_scene_id === scene.id
              return (
                <button
                  key={scene.id}
                  type="button"
                  onClick={() => setActiveScene(active ? null : scene.id)}
                  className={`relative overflow-hidden rounded-xl border transition-all ${
                    active
                      ? 'border-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)]'
                  }`}
                >
                  {active && (
                    <span className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-primary)]">
                      <Check size={11} className="text-white" />
                    </span>
                  )}
                  <div className="relative h-[90px] w-full bg-[var(--surface-2)]">
                    {scene.public_url ? (
                      <img
                        src={scene.public_url}
                        alt={scene.display_name ?? scene.original_file_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon size={24} className="text-[var(--text-tertiary)]" />
                      </div>
                    )}
                  </div>
                  <div className="bg-[hsla(var(--bg-1),_1)] px-3 py-2">
                    <p className="truncate text-body font-medium text-[var(--text-primary)]">
                      {scene.display_name ?? scene.original_file_name}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
