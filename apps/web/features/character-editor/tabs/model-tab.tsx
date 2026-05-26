'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { CardModelUploader } from '@/entities/soul/services/upload/CardModelUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import AvatarRenderer from '@/features/avatar/avatar-renderer'
import { useCardModel } from '@/features/avatar/hooks/use-card-model'
import { listCardModels, activateCardModel, type AiCardModelResponse } from '@/features/soul/api/index'
import { useSceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import type { AiCharacter, ModelType } from '@/shared/lib/character'

const MODEL_TYPES: { value: ModelType; label: string; ext: string }[] = [
  { value: 'vrm',    label: 'VRM',       ext: '.vrm' },
  { value: 'glb',    label: 'GLB / glTF', ext: '.glb' },
  { value: 'live2d', label: 'Live2D',    ext: '.model3.json' },
  { value: 'none',   label: 'No model',  ext: '' },
]

const ACCEPT_MAP: Record<ModelType, string> = {
  live2d: '.zip,.json',
  vrm: '.vrm',
  glb: '.glb,.gltf',
  none: '',
}

const ANIMATIONS = ['Idle', 'Talk', 'Dance', 'Wave']

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileExtension(fileName: string): string {
  const m = fileName.match(/\.[^.]+$/)
  return m ? m[0] : ''
}

interface ModelTabProps {
  character: AiCharacter
  onUpdate: (patch: Partial<AiCharacter>) => void
  cardId?: string
}

export default function ModelTab({ character, onUpdate, cardId }: ModelTabProps) {
  const { t } = useTranslation('model')
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploadBusy, setUploadBusy]       = useState(false)
  const [uploadHint, setUploadHint]       = useState<string | null>(null)
  const [refreshKey, setRefreshKey]       = useState(0)
  const [allModels, setAllModels]         = useState<AiCardModelResponse[]>([])
  const [activatingId, setActivatingId]   = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [animation, setAnimation]         = useState('Idle')

  const { model } = useCardModel(cardId, refreshKey)
  const { settings, setSettings, resetSettings } = useSceneRendererSettings(cardId ?? '')

  const loadAll = useCallback(async () => {
    if (!cardId) return
    try {
      const list = await listCardModels(cardId)
      setAllModels(list)
    } catch { /* silent */ }
  }, [cardId])

  useEffect(() => { void loadAll() }, [loadAll, refreshKey])

  const handleFile = async (file: File) => {
    onUpdate({ appearance: { ...character.appearance, modelFileName: file.name } })
    setUploadHint(null)
    if (!cardId) { setUploadHint(t('upload.saveFirst')); return }
    setUploadBusy(true)
    try {
      await executePresignedUpload(new CardModelUploader(cardId), file)
      setUploadHint(t('upload.success'))
      setRefreshKey(k => k + 1)
    } catch (err) {
      setUploadHint(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadBusy(false)
    }
  }

  const activeModel   = allModels.find(m => m.is_active) ?? allModels[0] ?? model

  const handleActivate = async (m: AiCardModelResponse) => {
    if (!cardId || m.is_active || activatingId) return
    setActivatingId(m.id)
    try {
      await activateCardModel(cardId, m.id)
      await loadAll()
    } catch { /* silent — UI stays unchanged */ }
    finally { setActivatingId(null) }
  }
  const modelTypeMeta = MODEL_TYPES.find(m => m.value === character.appearance.modelType)!
  const filteredModels = search
    ? allModels.filter(m => m.original_file_name.toLowerCase().includes(search.toLowerCase()))
    : allModels

  return (
    <div className="flex flex-col gap-8 w-full">
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT_MAP[character.appearance.modelType]}
        style={{ display: 'none' }}
        onChange={async e => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) await handleFile(file)
        }}
      />

      {/* ── Top two-column grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-[1fr_304px] gap-5 items-start">

        {/* Left: Current Model card */}
        <div className={cn(
          'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden',
        )}>
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
            <span className="text-[0.8125rem] font-semibold text-[var(--text-secondary)]">Current Model</span>
            {activeModel && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-green-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active
              </span>
            )}
          </div>

          {/* Preview */}
          <div className="h-[340px] bg-[#0d0d0f]">
            <AvatarRenderer
              modelType={character.appearance.modelType}
              modelUrl={activeModel?.public_url ?? null}
              background="#0d0d0f"
              rendererSettings={settings}
            />
          </div>

          {/* Meta + actions */}
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)] leading-snug mb-2">
                {activeModel?.original_file_name ?? character.name}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.8125rem]">
                <dt className="text-[var(--text-tertiary)]">Type</dt>
                <dd className="text-[var(--text-primary)] m-0">{modelTypeMeta.label}</dd>
                <dt className="text-[var(--text-tertiary)]">Format</dt>
                <dd className="text-[var(--text-primary)] m-0">
                  {activeModel ? fileExtension(activeModel.original_file_name) : modelTypeMeta.ext || '—'}
                </dd>
                <dt className="text-[var(--text-tertiary)]">Size</dt>
                <dd className="text-[var(--text-primary)] m-0">
                  {activeModel ? formatBytes(activeModel.size_bytes) : '—'}
                </dd>
              </dl>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {/* Model type selector (small dropdown) */}
              <select
                value={character.appearance.modelType}
                onChange={e => onUpdate({ appearance: { ...character.appearance, modelType: e.target.value as ModelType, modelFileName: null } })}
                className={cn(
                  'h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]',
                  'px-2 text-[0.8125rem] text-[var(--text-primary)] outline-none cursor-pointer',
                  'hover:border-[var(--border-default)] transition-colors',
                )}
              >
                {MODEL_TYPES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>

              <button
                type="button"
                disabled={character.appearance.modelType === 'none' || uploadBusy}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3',
                  'text-[0.8125rem] font-medium text-[var(--text-primary)]',
                  'hover:bg-[var(--surface-3)] hover:border-[var(--border-default)] transition-colors',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {uploadBusy ? 'Uploading…' : 'Replace Model'}
              </button>
            </div>
          </div>

          {uploadHint && (
            <p className="px-5 pb-3 text-[0.75rem] text-[var(--text-tertiary)]">{uploadHint}</p>
          )}
        </div>

        {/* Right: Model Settings card */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 flex flex-col gap-5">
          <p className="text-[0.9375rem] font-semibold text-[var(--text-primary)]">Model Settings</p>

          {/* Default Animation */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Default Animation</label>
            <select
              value={animation}
              onChange={e => setAnimation(e.target.value)}
              className={cn(
                'h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]',
                'px-3 text-[0.8125rem] text-[var(--text-primary)] outline-none cursor-pointer',
                'hover:border-[var(--border-default)] transition-colors w-full',
              )}
            >
              {ANIMATIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Scaling */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Scaling</label>
              <span className="text-[0.8125rem] text-[var(--text-primary)] tabular-nums">
                {settings.renderScale.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.5} max={3} step={0.01}
              value={settings.renderScale}
              onChange={e => setSettings({ renderScale: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent-primary)] h-1.5 rounded-full cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Rotation</label>
            <div className="flex gap-1.5">
              {(['X', 'Y', 'Z'] as const).map(axis => (
                <button
                  key={axis}
                  type="button"
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-[0.8125rem] font-medium transition-colors',
                    axis === 'Y'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-tertiary)]',
                  )}
                >
                  {axis}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0} max={360} step={1}
              value={settings.rotY}
              onChange={e => setSettings({ rotY: parseFloat(e.target.value) })}
              className="w-full accent-[var(--accent-primary)] h-1.5 rounded-full cursor-pointer"
            />
          </div>

          {/* Position Offset */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.8125rem] font-medium text-[var(--text-secondary)]">Position Offset</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['posX', 'posY', 'posZ'] as const).map((key, i) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-[0.6875rem] text-[var(--text-tertiary)] text-center">
                    {['X', 'Y', 'Z'][i]}
                  </span>
                  <input
                    type="number"
                    step={0.01}
                    value={settings[key]}
                    onChange={e => setSettings({ [key]: parseFloat(e.target.value) || 0 })}
                    className={cn(
                      'w-full h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]',
                      'px-2 text-[0.8125rem] text-[var(--text-primary)] text-center tabular-nums outline-none',
                      'hover:border-[var(--border-default)] focus:border-[var(--accent-primary)] transition-colors',
                    )}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Reset */}
          <button
            type="button"
            onClick={resetSettings}
            className={cn(
              'flex items-center justify-center gap-1.5 h-8 rounded-lg w-full',
              'border border-[var(--border-subtle)] bg-transparent',
              'text-[0.8125rem] font-medium text-[var(--text-secondary)]',
              'hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors',
            )}
          >
            <span>↺</span> Reset to Default
          </button>
        </div>
      </div>

      {/* ── Available Models ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[1rem] font-semibold text-[var(--text-primary)]">Available Models</h2>
            <p className="text-[0.8125rem] text-[var(--text-secondary)] mt-0.5">
              Select another model from your library or upload a new one.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="search"
              placeholder="Search models..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(
                'h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]',
                'px-3 text-[0.8125rem] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'outline-none focus:border-[var(--accent-primary)] transition-colors w-44',
              )}
            />
            <button
              type="button"
              disabled={character.appearance.modelType === 'none' || uploadBusy}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex items-center gap-1.5 h-8 rounded-lg px-3',
                'bg-[var(--accent-primary)] text-white text-[0.8125rem] font-medium',
                'hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Model
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {filteredModels.map((m) => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => void handleActivate(m)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') void handleActivate(m) }}
              className={cn(
                'relative rounded-xl border bg-[var(--surface-1)] overflow-hidden',
                'transition-colors group',
                m.is_active
                  ? 'border-[var(--accent-primary)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-default)] cursor-pointer',
                activatingId === m.id && 'opacity-60',
              )}
            >
              {/* Active badge */}
              {m.is_active && (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[0.6875rem] font-semibold text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Active
                </div>
              )}

              {/* Preview */}
              <div className="h-[120px] bg-[#0d0d0f]">
                <AvatarRenderer
                  modelType={character.appearance.modelType}
                  modelUrl={m.public_url}
                  background="#0d0d0f"
                />
              </div>

              {/* Info */}
              <div className="px-3 py-2.5">
                <p className="text-[0.8125rem] font-semibold text-[var(--text-primary)] truncate leading-snug">
                  {m.original_file_name.replace(/\.[^.]+$/, '')}
                </p>
                <p className="text-[0.75rem] text-[var(--text-tertiary)] mt-0.5">
                  {modelTypeMeta.label} · {formatBytes(m.size_bytes)}
                </p>
              </div>
            </div>
          ))}

          {/* Upload new model card */}
          <button
            type="button"
            disabled={character.appearance.modelType === 'none' || uploadBusy}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed',
              'border-[var(--border-subtle)] bg-[var(--surface-1)] min-h-[180px]',
              'text-[var(--text-tertiary)] transition-colors cursor-pointer',
              'hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="text-center">
              <p className="text-[0.8125rem] font-medium">Upload New Model</p>
              <p className="text-[0.75rem] mt-0.5">VRM or GLB</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
