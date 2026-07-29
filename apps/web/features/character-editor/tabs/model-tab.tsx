'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Slider } from '@/shared/ui/slider'
import { AvatarRenderer } from '@/features/avatar' // fsd:cross-feature-ok - editor embeds avatar preview
import { useSceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'
import type { AiCharacter, ModelType } from '@/shared/lib/character'
import { ANIMATION_PRESETS, type AnimationPreset } from '../lib'
import { useModelTab } from './useModelTab'
import { useThumbnailCapture } from '../hooks/use-thumbnail-capture'

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


function inferModelType(fileName: string): ModelType {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.vrm')) return 'vrm'
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'glb'
  if (lower.endsWith('.model3.json')) return 'live2d'
  return 'none'
}

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
  const tab = useModelTab(character, onUpdate, cardId)
  const { settings, setSettings, resetSettings } = useSceneRendererSettings(cardId ?? '')

  const modelLabel = (m: { value: ModelType; label: string }) => m.value === 'none' ? t('tab.noModel') : m.label
  const modelTypeMeta  = MODEL_TYPES.find(m => m.value === character.appearance.modelType)!
  const { fileRef, uploadBusy, uploadHint, filteredModels, activeModel, displayModel, activatingId,
          confirmDeleteId, deletingId, requestDelete, cancelDelete, handleDelete,
          search, setSearch, animation, setAnimation, handleFile, handleActivate } = tab

  const effectiveModelType: ModelType =
    character.appearance.modelType !== 'none'
      ? character.appearance.modelType
      : displayModel
        ? inferModelType(displayModel.original_file_name)
        : 'none'

  const { capture, isCapturing } = useThumbnailCapture(cardId, displayModel?.id)

  return (
    <div className="relative flex flex-col gap-8 w-full">
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

      <div className="grid grid-cols-[1fr_304px] gap-5 items-start">

        {/* Left: Current Model card */}
        <div className={cn(
          'rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] overflow-hidden',
        )}>
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-subtle)]">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">{t('tab.currentModel')}</span>
            {activeModel && (
              <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-caption font-semibold text-green-500">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {t('tab.active')}
              </span>
            )}
          </div>

          {/* Preview */}
          <div className="relative h-[340px] bg-[#0d0d0f]">
            <AvatarRenderer
              modelType={effectiveModelType}
              modelUrl={displayModel?.public_url ?? null}
              background="#0d0d0f"
              rendererSettings={settings}
              onFirstRender={effectiveModelType === 'vrm' && !displayModel?.thumbnail_url ? capture : undefined}
              captureCamera={!displayModel?.thumbnail_url
                ? { heightRatio: 0.75, distance: 1.0, fov: 25 }
                : undefined}
            />
            {isCapturing && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1">
                <div className="h-2 w-2 rounded-full bg-white/60 animate-pulse" />
                <span className="text-[10px] text-white/70">{t('tab.savingPreview')}</span>
              </div>
            )}
          </div>

          {/* Meta + actions */}
          <div className="px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-body-md font-semibold text-[var(--text-primary)] leading-snug mb-2">
                {activeModel?.original_file_name ?? character.name}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-[var(--text-tertiary)]">{t('tab.type')}</dt>
                <dd className="text-[var(--text-primary)] m-0">{modelLabel(modelTypeMeta)}</dd>
                <dt className="text-[var(--text-tertiary)]">{t('tab.format')}</dt>
                <dd className="text-[var(--text-primary)] m-0">
                  {activeModel ? fileExtension(activeModel.original_file_name) : modelTypeMeta.ext || '—'}
                </dd>
                <dt className="text-[var(--text-tertiary)]">{t('tab.size')}</dt>
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
                  'px-2 text-sm text-[var(--text-primary)] outline-none cursor-pointer',
                  'hover:border-[var(--border-default)] transition-colors',
                )}
              >
                {MODEL_TYPES.map(m => (
                  <option key={m.value} value={m.value}>{modelLabel(m)}</option>
                ))}
              </select>

              <button
                type="button"
                disabled={character.appearance.modelType === 'none' || uploadBusy}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3',
                  'text-sm font-medium text-[var(--text-primary)]',
                  'hover:bg-[var(--surface-3)] hover:border-[var(--border-default)] transition-colors',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                {uploadBusy ? t('tab.uploading') : t('tab.replaceModel')}
              </button>
            </div>
          </div>

          {uploadHint && (
            <p className="px-5 pb-3 text-xs text-[var(--text-tertiary)]">{uploadHint}</p>
          )}
        </div>

        {/* Right: Model Settings card */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 flex flex-col gap-5">
          <p className="text-body-md font-semibold text-[var(--text-primary)]">{t('tab.modelSettings')}</p>

          {/* Default Animation */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('tab.defaultAnimation')}</label>
            <select
              value={animation}
              onChange={e => setAnimation(e.target.value as AnimationPreset)}
              className={cn(
                'h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]',
                'px-3 text-sm text-[var(--text-primary)] outline-none cursor-pointer',
                'hover:border-[var(--border-default)] transition-colors w-full',
              )}
            >
              {ANIMATION_PRESETS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Scaling */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-secondary)]">{t('tab.scaling')}</label>
              <span className="text-sm text-[var(--text-primary)] tabular-nums">
                {settings.camera.renderScale.toFixed(2)}
              </span>
            </div>
            <Slider
              value={settings.camera.renderScale} onChange={v => setSettings({ camera: { ...settings.camera, renderScale: v } })}
              min={0.5} max={3} step={0.01}
              fill="var(--text-primary)" trackHeight={4} thumbSize={13}
            />
          </div>

          {/* Rotation */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('tab.rotation')}</label>
            <div className="flex gap-1.5">
              {(['X', 'Y', 'Z'] as const).map(axis => (
                <button
                  key={axis}
                  type="button"
                  className={cn(
                    'flex-1 h-8 rounded-lg border text-sm font-medium transition-colors',
                    axis === 'Y'
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-tertiary)]',
                  )}
                >
                  {axis}
                </button>
              ))}
            </div>
            <Slider
              value={settings.position.rotY} onChange={v => setSettings({ position: { ...settings.position, rotY: v } })}
              min={0} max={360} step={1}
              fill="var(--text-primary)" trackHeight={4} thumbSize={13}
            />
          </div>

          {/* Position Offset */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">{t('tab.positionOffset')}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['posX', 'posY', 'posZ'] as const).map((key, i) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-caption text-[var(--text-tertiary)] text-center">
                    {['X', 'Y', 'Z'][i]}
                  </span>
                  <input
                    type="number"
                    step={0.01}
                    value={settings.position[key]}
                    onChange={e => setSettings({ position: { ...settings.position, [key]: parseFloat(e.target.value) || 0 } })}
                    className={cn(
                      'w-full h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]',
                      'px-2 text-sm text-[var(--text-primary)] text-center tabular-nums outline-none',
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
              'text-sm font-medium text-[var(--text-secondary)]',
              'hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors',
            )}
          >
            <span>↺</span> {t('tab.resetDefault')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-[1rem] font-semibold text-[var(--text-primary)]">{t('tab.availableModels')}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {t('tab.availableModelsDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="search"
              placeholder={t('tab.searchModels')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={cn(
                'h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)]',
                'px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]',
                'outline-none focus:border-[var(--accent-primary)] transition-colors w-44',
              )}
            />
            <button
              type="button"
              disabled={character.appearance.modelType === 'none' || uploadBusy}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex items-center gap-1.5 h-8 rounded-lg px-3',
                'bg-[var(--accent-primary)] text-white text-sm font-medium',
                'hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed',
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {t('tab.uploadModel')}
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
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-caption font-semibold text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('tab.active')}
                </div>
              )}

              {/* Trash button (hover) */}
              {confirmDeleteId !== m.id && deletingId !== m.id && (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); requestDelete(m) }}
                  className={cn(
                    'absolute top-2 right-2 z-20 flex items-center justify-center w-6 h-6 rounded-md',
                    'bg-black/40 text-white/60 opacity-0 group-hover:opacity-100',
                    'hover:bg-red-500/80 hover:text-white transition-all',
                  )}
                  aria-label={t('tab.deleteModel')}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              )}

              {/* Confirm-delete overlay */}
              {confirmDeleteId === m.id && (
                <div
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 rounded-xl bg-[var(--surface-1)]/95 backdrop-blur-sm"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/15">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400" aria-hidden>
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{t('tab.deleteModelQ')}</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{t('tab.cannotUndo')}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={cancelDelete}
                      className={cn(
                        'h-7 rounded-lg border border-[var(--border-subtle)] bg-transparent px-3',
                        'text-xs font-medium text-[var(--text-secondary)]',
                        'hover:border-[var(--border-default)] hover:text-[var(--text-primary)] transition-colors',
                      )}
                    >
                      {t('tab.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(m)}
                      className="h-7 rounded-lg bg-red-500/90 hover:bg-red-500 px-3 text-xs font-medium text-white transition-colors"
                    >
                      {t('tab.delete')}
                    </button>
                  </div>
                </div>
              )}

              {/* Deleting overlay */}
              {deletingId === m.id && (
                <div
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--surface-1)]/95 backdrop-blur-sm"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="h-5 w-5 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--text-tertiary)] animate-spin" />
                  <p className="text-xs text-[var(--text-tertiary)]">{t('tab.deleting')}</p>
                </div>
              )}

              {/* Preview */}
              <div className="h-[120px] bg-[#0d0d0f]">
                {m.thumbnail_url ? (
                  <img
                    src={m.thumbnail_url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>

              {/* Info */}
              <div className="px-3 py-2.5">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate leading-snug">
                  {m.original_file_name.replace(/\.[^.]+$/, '')}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {modelLabel(modelTypeMeta)} · {formatBytes(m.size_bytes)}
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
              <p className="text-sm font-medium">{t('tab.uploadNewModel')}</p>
              <p className="text-xs mt-0.5">{t('tab.vrmOrGlb')}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
