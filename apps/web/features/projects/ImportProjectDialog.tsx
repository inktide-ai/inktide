'use client'

import { useCallback, useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import {
  parseInktFile,
  finalizeImport,
  type InktParseResponse,
} from '@/features/projects/api/projects'

type Phase = 'idle' | 'parsing' | 'preview' | 'finalizing' | 'done'

interface Props {
  open: boolean
  onClose: () => void
  onImported: (projectId: string) => void
}

export default function ImportProjectDialog({ open, onClose, onImported }: Props) {
  const { cardList } = useCharactersContext()

  const [phase, setPhase] = useState<Phase>('idle')
  const [parseResult, setParseResult] = useState<InktParseResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [targetSoulId, setTargetSoulId] = useState<string>('__new__')
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setPhase('idle')
    setParseResult(null)
    setError(null)
    setTargetSoulId('__new__')
    setIsDragOver(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.inkt')) {
      setError('File must be a .inkt archive.')
      return
    }
    setPhase('parsing')
    setError(null)
    try {
      const result = await parseInktFile(file)
      setParseResult(result)
      setPhase('preview')
    } catch {
      setError('Failed to parse file. Make sure it is a valid .inkt archive.')
      setPhase('idle')
    }
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void processFile(file)
      e.target.value = ''
    },
    [processFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file) void processFile(file)
    },
    [processFile],
  )

  const handleFinalize = useCallback(async () => {
    if (!parseResult) return
    setPhase('finalizing')
    setError(null)
    try {
      const result = await finalizeImport({
        parse_token: parseResult.parse_token,
        target_soul_id: targetSoulId === '__new__' ? undefined : targetSoulId,
        import_connectors_disabled: true,
      })
      setPhase('done')
      onImported(result.project_id)
    } catch {
      setError('Import failed. The session may have expired — please try again.')
      setPhase('preview')
    }
  }, [parseResult, targetSoulId, onImported])

  return (
    <Dialog.Root
      open={open}
      onOpenChange={next => {
        if (!next) handleClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[2000]"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-[14px] overflow-hidden outline-none"
          style={{
            width: 'min(520px, 95vw)',
            maxHeight: '85vh',
            background: 'var(--menu-panel-bg)',
            boxShadow: 'var(--menu-panel-shadow)',
          }}
        >
          <Dialog.Title className="sr-only">Import Project</Dialog.Title>

          {/* Header */}
          <div
            className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                Import Project
              </h2>
              <p className="mt-0.5 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                {phase === 'preview'
                  ? 'Review your project before importing.'
                  : 'Upload a .inkt file to import a project.'}
              </p>
            </div>
            <Dialog.Close
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLElement).style.background = 'var(--surface-2)')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLElement).style.background = 'transparent')
              }
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {(phase === 'idle' || phase === 'parsing') && (
              <DropZone
                isDragOver={isDragOver}
                loading={phase === 'parsing'}
                error={error}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onBrowse={() => fileInputRef.current?.click()}
              />
            )}

            {phase === 'preview' && parseResult && (
              <PreviewPanel
                result={parseResult}
                souls={cardList}
                targetSoulId={targetSoulId}
                onTargetSoulIdChange={setTargetSoulId}
                error={error}
              />
            )}

            {phase === 'finalizing' && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Spinner />
                <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                  Importing project…
                </p>
              </div>
            )}

            {phase === 'done' && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: 'var(--accent-soft)' }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Project imported
                </p>
                <p className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
                  Your project is ready. Connectors need to be reconnected manually.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {(phase === 'preview' || phase === 'done') && (
            <div
              className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0"
              style={{ borderTop: '1px solid var(--border-subtle)' }}
            >
              {phase === 'preview' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setPhase('idle'); setParseResult(null); setError(null) }}
                    className="h-9 px-4 rounded-lg text-[14px] font-medium transition-colors"
                    style={{ color: 'var(--text-secondary)', background: 'var(--surface-2)' }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFinalize()}
                    className="h-9 px-4 rounded-lg text-[14px] font-medium text-white"
                    style={{ background: 'var(--accent-primary)' }}
                  >
                    Import Project
                  </button>
                </>
              )}
              {phase === 'done' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-4 rounded-lg text-[14px] font-medium text-white"
                  style={{ background: 'var(--accent-primary)' }}
                >
                  Done
                </button>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".inkt"
        className="sr-only"
        onChange={handleFileInput}
        tabIndex={-1}
      />
    </Dialog.Root>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({
  isDragOver, loading, error, onDragOver, onDragLeave, onDrop, onBrowse,
}: {
  isDragOver: boolean
  loading: boolean
  error: string | null
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onBrowse: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowse}
        className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors"
        style={{
          borderColor: isDragOver ? 'var(--accent-primary)' : 'var(--border-default)',
          background: isDragOver ? 'var(--accent-soft)' : 'var(--surface-1)',
        }}
      >
        {loading ? (
          <Spinner />
        ) : (
          <>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="text-center">
              <p className="text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
                Drop your .inkt file here
              </p>
              <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                or click to browse
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="text-[14px] text-center" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function PreviewPanel({
  result, souls, targetSoulId, onTargetSoulIdChange, error,
}: {
  result: InktParseResponse
  souls: { id: string; name: string }[]
  targetSoulId: string
  onTargetSoulIdChange: (id: string) => void
  error: string | null
}) {
  return (
    <div className="flex flex-col gap-4">
      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div
          className="rounded-lg px-4 py-3"
          style={{ background: '#92400e22', border: '1px solid #92400e55' }}
        >
          <p className="text-[14px] font-semibold mb-1.5" style={{ color: '#fbbf24' }}>
            Compatibility warnings
          </p>
          <ul className="list-disc list-inside space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-[14px]" style={{ color: '#fcd34d' }}>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project info */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        <div className="px-4 py-2.5" style={{ background: 'var(--surface-1)', borderBottom: '1px solid var(--border-subtle)' }}>
          <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Project details
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px" style={{ background: 'var(--border-subtle)' }}>
          <InfoRow label="Name" value={result.project_name} />
          {result.soul_name && <InfoRow label="Soul" value={result.soul_name} />}
          <InfoRow label="Graph" value={result.has_graph ? 'Yes' : 'No'} />
          {result.connector_count > 0 && (
            <InfoRow label="Connectors" value={`${result.connector_count} (need re-auth)`} />
          )}
          {result.llm_model_id && (
            <InfoRow label="LLM Model" value={`${result.llm_model_id}${result.llm_provider ? ` · ${result.llm_provider}` : ''}`} />
          )}
          {result.tts_voice_id && (
            <InfoRow label="TTS Voice" value={`${result.tts_voice_id}${result.tts_provider ? ` · ${result.tts_provider}` : ''}`} />
          )}
        </div>
      </div>

      {/* Soul mapping */}
      {result.soul_name && (
        <div className="flex flex-col gap-2">
          <label className="text-[14px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Import Soul as
          </label>
          <select
            value={targetSoulId}
            onChange={e => onTargetSoulIdChange(e.target.value)}
            className="h-9 w-full rounded-lg px-3 text-[14px] outline-none"
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="__new__">Create new Soul from template</option>
            {souls.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
            {targetSoulId === '__new__'
              ? 'A new Soul will be created with the exported configuration.'
              : 'The selected Soul will be linked to the new project (its configuration will not change).'}
          </p>
        </div>
      )}

      {error && (
        <p className="text-[14px]" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5" style={{ background: 'var(--surface-1)' }}>
      <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-[14px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
