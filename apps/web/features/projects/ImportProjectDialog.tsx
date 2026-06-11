'use client'

import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from '@/shared/ui/dialog'
import { useCharactersContext } from '@/entities/character/context/CharactersContext'
import { cn } from '@/lib/utils'
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
  const { t } = useTranslation('common')
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
      setError(t('importProject.errorNotInkt'))
      return
    }
    setPhase('parsing')
    setError(null)
    try {
      const result = await parseInktFile(file)
      setParseResult(result)
      setPhase('preview')
    } catch {
      setError(t('importProject.errorParse'))
      setPhase('idle')
    }
  }, [t])

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
      setError(t('importProject.errorImport'))
      setPhase('preview')
    }
  }, [parseResult, targetSoulId, onImported, t])

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) handleClose()
      }}
    >
      <DialogPortal>
        <DialogOverlay
          className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-[4px]"
        />
        <DialogContent
          className="fixed left-1/2 top-1/2 z-[2001] -translate-x-1/2 -translate-y-1/2 flex flex-col w-[min(520px,95vw)] max-h-[85vh] rounded-[14px] overflow-hidden outline-none bg-[var(--menu-panel-bg)] shadow-[var(--menu-panel-shadow)]"
        >
          <DialogTitle className="sr-only">{t('importProject.title')}</DialogTitle>

          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 flex-shrink-0 border-b border-[var(--border-subtle)]">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                {t('importProject.title')}
              </h2>
              <p className="mt-0.5 text-body text-[var(--text-secondary)]">
                {phase === 'preview'
                  ? t('importProject.subtitlePreview')
                  : t('importProject.subtitleUpload')}
              </p>
            </div>
            <DialogClose
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </DialogClose>
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
                <p className="text-body text-[var(--text-secondary)]">
                  {t('importProject.importing')}
                </p>
              </div>
            )}

            {phase === 'done' && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-body font-semibold text-[var(--text-primary)]">
                  {t('importProject.doneTitle')}
                </p>
                <p className="text-body text-[var(--text-secondary)]">
                  {t('importProject.doneDesc')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {(phase === 'preview' || phase === 'done') && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 flex-shrink-0 border-t border-[var(--border-subtle)]">
              {phase === 'preview' && (
                <>
                  <button
                    type="button"
                    onClick={() => { setPhase('idle'); setParseResult(null); setError(null) }}
                    className="h-9 px-4 rounded-lg text-body font-medium transition-colors text-[var(--text-secondary)] bg-[var(--surface-2)]"
                  >
                    {t('importProject.back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleFinalize()}
                    className="h-9 px-4 rounded-lg text-body font-medium text-white bg-[var(--accent-primary)]"
                  >
                    {t('importProject.title')}
                  </button>
                </>
              )}
              {phase === 'done' && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-9 px-4 rounded-lg text-body font-medium text-white bg-[var(--accent-primary)]"
                >
                  {t('importProject.done')}
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </DialogPortal>

      <input
        ref={fileInputRef}
        type="file"
        accept=".inkt"
        className="sr-only"
        onChange={handleFileInput}
        tabIndex={-1}
      />
    </Dialog>
  )
}


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
  const { t } = useTranslation('common')
  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowse}
        className={cn(
          'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors',
          isDragOver
            ? 'border-[var(--accent-primary)] bg-[var(--accent-soft)]'
            : 'border-[var(--border-default)] bg-[var(--surface-1)]',
        )}
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
              <p className="text-body font-medium text-[var(--text-primary)]">
                {t('importProject.dropHere')}
              </p>
              <p className="text-body mt-0.5 text-[var(--text-secondary)]">
                {t('importProject.clickToBrowse')}
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <p className="text-body text-center text-[var(--color-error-mid)]">
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
  const { t } = useTranslation('common')
  return (
    <div className="flex flex-col gap-4">
      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="rounded-lg px-4 py-3 bg-[#92400e22] border border-[#92400e55]">
          <p className="text-body font-semibold mb-1.5 text-amber-400">
            {t('importProject.warnings')}
          </p>
          <ul className="list-disc list-inside space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i} className="text-body text-amber-300">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project info */}
      <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)]">
        <div className="px-4 py-2.5 bg-[var(--surface-1)] border-b border-[var(--border-subtle)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            {t('importProject.details')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)]">
          <InfoRow label={t('importProject.name')} value={result.project_name} />
          {result.soul_name && <InfoRow label={t('importProject.soul')} value={result.soul_name} />}
          <InfoRow label={t('importProject.graph')} value={result.has_graph ? t('importProject.yes') : t('importProject.no')} />
          {result.connector_count > 0 && (
            <InfoRow label={t('importProject.connectors')} value={t('importProject.connectorsValue', { count: result.connector_count })} />
          )}
          {result.llm_model_id && (
            <InfoRow label={t('importProject.llmModel')} value={`${result.llm_model_id}${result.llm_provider ? ` · ${result.llm_provider}` : ''}`} />
          )}
          {result.tts_voice_id && (
            <InfoRow label={t('importProject.ttsVoice')} value={`${result.tts_voice_id}${result.tts_provider ? ` · ${result.tts_provider}` : ''}`} />
          )}
        </div>
      </div>

      {/* Soul mapping */}
      {result.soul_name && (
        <div className="flex flex-col gap-2">
          <label className="text-body font-medium text-[var(--text-secondary)]">
            {t('importProject.importSoulAs')}
          </label>
          <select
            value={targetSoulId}
            onChange={e => onTargetSoulIdChange(e.target.value)}
            className="h-9 w-full rounded-lg px-3 text-body outline-none bg-[var(--surface-1)] border border-[var(--border-default)] text-[var(--text-primary)]"
          >
            <option value="__new__">{t('importProject.createNewSoul')}</option>
            {souls.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <p className="text-xs text-[var(--text-tertiary)]">
            {targetSoulId === '__new__'
              ? t('importProject.newSoulDesc')
              : t('importProject.existingSoulDesc')}
          </p>
        </div>
      )}

      {error && (
        <p className="text-body text-[var(--color-error-mid)]">
          {error}
        </p>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-2.5 bg-[var(--surface-1)]">
      <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      <span className="text-body font-medium truncate text-[var(--text-primary)]">{value}</span>
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
