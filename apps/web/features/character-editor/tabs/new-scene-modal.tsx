'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type AiCardSceneResponse } from '../../../api/soul'
import { CardSceneUploader } from '../../../services/upload/CardSceneUploader'
import { executePresignedUpload } from '../../../services/upload/PresignedUploadService'

const MAX_MB = 50
const ALLOWED_TYPES = 'image/jpeg,image/png,image/webp'

interface NewSceneModalProps {
  cardId: string
  tagOptions: string[]
  onClose: () => void
  onCreated: (scene: AiCardSceneResponse) => void
}

export function NewSceneModal({ cardId, tagOptions, onClose, onCreated }: NewSceneModalProps) {
  const { t } = useTranslation('scene')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = name.trim().length > 0 && file !== null && !uploading

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => { return () => { if (preview) URL.revokeObjectURL(preview) } }, [preview])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_MB * 1024 * 1024) { setError(t('settings.errorTooLarge', { max: MAX_MB })); return }
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError(null)
  }

  async function handleCreate() {
    if (!file || !name.trim()) return
    setUploading(true)
    setError(null)
    try {
      const ext = file.name.match(/\.[^.]+$/)?.[0] ?? '.jpg'
      const renamedFile = new File([file], `${name.trim()}${ext}`, { type: file.type })
      const scene = await executePresignedUpload(new CardSceneUploader(cardId, selectedTag ?? null), renamedFile)
      onCreated(scene)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
      setUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-0)] shadow-2xl animate-[pageIn_0.18s_cubic-bezier(0.2,0.9,0.2,1)]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <span className="text-[15px] font-semibold text-[var(--text-primary)]">{t('modal.title')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-5">

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-[var(--text-secondary)]">{t('modal.nameLabel')}</label>
            <input
              autoFocus
              maxLength={40}
              value={name}
              onChange={e => setName(e.target.value.slice(0, 40))}
              placeholder={t('modal.namePlaceholder')}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
            <span className="text-right text-[12px] text-[var(--text-tertiary)]">{name.length}/40</span>
          </div>

          {/* Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-[var(--text-secondary)]">{t('modal.imageLabel')}</label>
            {preview ? (
              <div className="relative h-[130px] w-full overflow-hidden rounded-lg border border-[var(--accent-primary)]/50">
                <img src={preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 rounded-md border border-[var(--border-subtle)] bg-black/60 px-2.5 py-1 text-[12px] text-[var(--text-secondary)] backdrop-blur-sm transition-colors hover:text-[var(--text-primary)]"
                >
                  {t('modal.change')}
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]/40 py-8 outline-none transition-colors hover:border-[var(--accent-primary)]/50 hover:bg-[var(--surface-1)]/70 focus-visible:border-[var(--accent-primary)]/50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)]">
                  <Upload size={15} />
                </div>
                <p className="text-[14px] font-medium text-[var(--text-secondary)]">{t('modal.uploadTitle')}</p>
                <p className="text-[14px] text-[var(--text-tertiary)]">{t('modal.uploadSub')}</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES} className="hidden" onChange={handleFileSelect} />
          </div>

          {/* Tag */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-[var(--text-secondary)]">{t('modal.tagLabel')}</label>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(prev => prev === tag ? null : tag)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[14px] font-medium transition-colors',
                    selectedTag === tag
                      ? 'border-[var(--accent-primary)]/60 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-tertiary)] hover:border-[var(--border-subtle)]/80 hover:text-[var(--text-secondary)]',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--text-secondary)]">
              {t('modal.descLabel')}
              <span className="text-[12px] font-normal text-[var(--text-tertiary)]">{t('modal.optional')}</span>
            </label>
            <textarea
              maxLength={120}
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 120))}
              placeholder={t('modal.descPlaceholder')}
              rows={3}
              className="w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-[14px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent-primary)]"
            />
            <span className="text-right text-[12px] text-[var(--text-tertiary)]">{description.length}/120</span>
          </div>

          {error && <p className="text-[14px] text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-[var(--border-subtle)] px-5 py-4">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] py-2 text-[14px] font-medium text-[var(--text-secondary)] transition-colors hover:enabled:bg-[var(--surface-2)]/80 disabled:opacity-40"
          >
            {t('modal.cancel')}
          </button>
          <button
            type="button"
            disabled={!canCreate}
            onClick={handleCreate}
            className="flex-[2] rounded-lg bg-[var(--accent-primary)] py-2 text-[14px] font-medium text-white transition-colors hover:enabled:bg-[var(--accent-hover)] disabled:opacity-40"
          >
            {uploading ? t('modal.creating') : t('modal.create')}
          </button>
        </div>

      </div>
    </div>
  )
}
