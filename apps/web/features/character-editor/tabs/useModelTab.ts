'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CardModelUploader } from '@/entities/soul/services/upload/CardModelUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import { useCardModel } from '@/entities/soul/hooks'
import { listCardModels, activateCardModel, type AiCardModelResponse } from '@/features/soul/api/index' // fsd:cross-feature-ok
import type { AiCharacter } from '@/shared/lib/character'
import { ANIMATION_PRESETS, type AnimationPreset } from '../lib'

export interface UseModelTabResult {
  fileRef: React.RefObject<HTMLInputElement>
  uploadBusy: boolean
  uploadHint: string | null
  allModels: AiCardModelResponse[]
  filteredModels: AiCardModelResponse[]
  activeModel: AiCardModelResponse | undefined
  activatingId: string | null
  search: string
  setSearch: (v: string) => void
  animation: AnimationPreset
  setAnimation: (v: AnimationPreset) => void
  handleFile: (file: File) => Promise<void>
  handleActivate: (m: AiCardModelResponse) => Promise<void>
}

export function useModelTab(
  character: AiCharacter,
  onUpdate: (patch: Partial<AiCharacter>) => void,
  cardId?: string,
): UseModelTabResult {
  const { t } = useTranslation('model')
  const fileRef = useRef<HTMLInputElement>(null)

  const [uploadBusy, setUploadBusy]     = useState(false)
  const [uploadHint, setUploadHint]     = useState<string | null>(null)
  const [refreshKey, setRefreshKey]     = useState(0)
  const [allModels, setAllModels]       = useState<AiCardModelResponse[]>([])
  const [activatingId, setActivatingId] = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [animation, setAnimation]       = useState<AnimationPreset>(ANIMATION_PRESETS[0])

  const { model } = useCardModel(cardId, refreshKey)

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

  const handleActivate = async (m: AiCardModelResponse) => {
    if (!cardId || m.is_active || activatingId) return
    setActivatingId(m.id)
    try {
      await activateCardModel(cardId, m.id)
      await loadAll()
    } catch { /* silent */ }
    finally { setActivatingId(null) }
  }

  const activeModel    = allModels.find(m => m.is_active) ?? allModels[0] ?? model
  const filteredModels = search
    ? allModels.filter(m => m.original_file_name.toLowerCase().includes(search.toLowerCase()))
    : allModels

  return {
    fileRef,
    uploadBusy, uploadHint,
    allModels, filteredModels,
    activeModel,
    activatingId,
    search, setSearch,
    animation, setAnimation,
    handleFile, handleActivate,
  }
}
