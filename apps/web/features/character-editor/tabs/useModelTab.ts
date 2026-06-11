'use client'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CardModelUploader } from '@/entities/soul/services/upload/CardModelUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import { listCardModels, activateCardModel, deleteCardModel, type AiCardModelResponse } from '@/features/soul/api/index' // fsd:cross-feature-ok
import { queryKeys } from '@/shared/lib/query/keys'
import type { AiCharacter } from '@/shared/lib/character'
import { ANIMATION_PRESETS, type AnimationPreset } from '../lib'

export interface UseModelTabResult {
  fileRef: React.RefObject<HTMLInputElement>
  uploadBusy: boolean
  uploadHint: string | null
  allModels: AiCardModelResponse[]
  filteredModels: AiCardModelResponse[]
  activeModel: AiCardModelResponse | undefined
  displayModel: AiCardModelResponse | undefined
  activatingId: string | null
  confirmDeleteId: string | null
  deletingId: string | null
  search: string
  setSearch: (v: string) => void
  animation: AnimationPreset
  setAnimation: (v: AnimationPreset) => void
  handleFile: (file: File) => Promise<void>
  handleActivate: (m: AiCardModelResponse) => Promise<void>
  requestDelete: (m: AiCardModelResponse) => void
  cancelDelete: () => void
  handleDelete: (m: AiCardModelResponse) => Promise<void>
}

export function useModelTab(
  character: AiCharacter,
  onUpdate: (patch: Partial<AiCharacter>) => void,
  cardId?: string,
): UseModelTabResult {
  const { t } = useTranslation('model')
  const fileRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const [uploadBusy, setUploadBusy]     = useState(false)
  const [uploadHint, setUploadHint]     = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId]     = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [animation, setAnimation]       = useState<AnimationPreset>(ANIMATION_PRESETS[0])
  const [previewModelId, setPreviewModelId] = useState<string | null>(null)

  const { data: allModels = [] } = useQuery({
    queryKey: queryKeys.souls.models(cardId ?? ''),
    queryFn:  () => listCardModels(cardId!),
    enabled:  !!cardId,
  })

  const handleFile = async (file: File) => {
    onUpdate({ appearance: { ...character.appearance, modelFileName: file.name } })
    setUploadHint(null)
    if (!cardId) { setUploadHint(t('upload.saveFirst')); return }
    setUploadBusy(true)
    try {
      const newModel = await executePresignedUpload(new CardModelUploader(cardId), file)
      setPreviewModelId(newModel.id)
      setUploadHint(t('upload.success'))
      await queryClient.invalidateQueries({ queryKey: queryKeys.souls.models(cardId) })
    } catch (err) {
      setUploadHint(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadBusy(false)
    }
  }

  const handleActivate = async (m: AiCardModelResponse) => {
    if (!cardId || m.is_active || activatingId) return
    setActivatingId(m.id)
    try {
      await activateCardModel(cardId, m.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.souls.models(cardId) })
    } catch { /* silent */ }
    finally { setActivatingId(null) }
  }

  const requestDelete = (m: AiCardModelResponse) => setConfirmDeleteId(m.id)
  const cancelDelete  = () => setConfirmDeleteId(null)

  const handleDelete = async (m: AiCardModelResponse) => {
    if (!cardId || deletingId) return
    setConfirmDeleteId(null)
    setDeletingId(m.id)
    try {
      await deleteCardModel(cardId, m.id)
      await queryClient.invalidateQueries({ queryKey: queryKeys.souls.models(cardId) })
    } catch { /* silent */ }
    finally { setDeletingId(null) }
  }

  const activeModel  = allModels.find(m => m.is_active) ?? allModels[0]
  const previewModel = allModels.find(m => m.id === previewModelId)
  const displayModel = previewModel ?? activeModel

  // Auto-clear preview once the model has a thumbnail (or disappears from list)
  useEffect(() => {
    if (!previewModelId) return
    const m = allModels.find(x => x.id === previewModelId)
    if (!m || m.thumbnail_url) setPreviewModelId(null)
  }, [allModels, previewModelId])

  const filteredModels = search
    ? allModels.filter(m => m.original_file_name.toLowerCase().includes(search.toLowerCase()))
    : allModels

  return {
    fileRef,
    uploadBusy, uploadHint,
    allModels, filteredModels,
    activeModel, displayModel,
    activatingId,
    confirmDeleteId, deletingId,
    search, setSearch,
    animation, setAnimation,
    handleFile, handleActivate,
    requestDelete, cancelDelete, handleDelete,
  }
}
