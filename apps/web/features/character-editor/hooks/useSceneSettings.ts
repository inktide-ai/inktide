'use client'
import { type RefObject, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AiCardSceneResponse } from '@/shared/types/soul-api'
import { listCustomSceneTags, putCardSceneMetadata, deleteCardScene } from '@/entities/soul/api'
import { CardSceneUploader } from '@/entities/soul/services/upload/CardSceneUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import { BUILTIN_SCENE_TAGS, mergeSceneTagPickOptions } from '../tabs/scene-tag-utils'

const TAG_AUTO_VALUE = '__auto__'
const MAX_DISPLAY = 200
const MAX_DESC = 2000
const ALLOWED_TYPES = 'image/jpeg,image/png,image/webp'
const MAX_MB = 50

export { TAG_AUTO_VALUE, MAX_DISPLAY, MAX_DESC, ALLOWED_TYPES }

export interface UseSceneSettingsResult {
  uploading:          boolean
  removing:           boolean
  error:              string | null
  tagPickOptions:     string[]
  metaDisplayName:    string
  setMetaDisplayName: (v: string) => void
  metaDescription:    string
  setMetaDescription: (v: string) => void
  metaTag:            string
  setMetaTag:         (v: string) => void
  metaSaving:         boolean
  metaError:          string | null
  handleSaveMeta:     () => Promise<void>
  handleReplace:      (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleUploadNew:    (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleDelete:       () => Promise<void>
}

interface UseSceneSettingsParams {
  scene:            AiCardSceneResponse | null
  cardId:           string | undefined
  fileInputRef:     RefObject<HTMLInputElement | null>
  onScenesChanged:  () => void
  onSceneReplaced?: (newSceneId: string) => void
  onSceneDeleted:   () => void
}

/**
 * Manages upload/delete lifecycle and metadata editing for a single scene card.
 * `fileInputRef` is provided by the parent so the hook can reset the input value
 * after each file selection without owning the DOM ref itself.
 */
export function useSceneSettings({
  scene, cardId, fileInputRef,
  onScenesChanged, onSceneReplaced, onSceneDeleted,
}: UseSceneSettingsParams): UseSceneSettingsResult {
  const { t } = useTranslation('scene')

  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [tagPickOptions, setTagPickOptions]       = useState<string[]>([...BUILTIN_SCENE_TAGS])
  const [metaDisplayName, setMetaDisplayName]     = useState('')
  const [metaDescription, setMetaDescription]     = useState('')
  const [metaTag, setMetaTag]                     = useState<string>(TAG_AUTO_VALUE)
  const [metaSaving, setMetaSaving]               = useState(false)
  const [metaError, setMetaError]                 = useState<string | null>(null)

  // Load custom tag options for this card's tag picker
  useEffect(() => {
    if (!cardId) { setTagPickOptions([...BUILTIN_SCENE_TAGS]); return }
    listCustomSceneTags(cardId)
      .then((c) => setTagPickOptions(mergeSceneTagPickOptions(c)))
      .catch(() => setTagPickOptions([...BUILTIN_SCENE_TAGS]))
  }, [cardId])

  // Sync metadata fields whenever the scene changes (different scene selected)
  useEffect(() => {
    if (!scene) { setMetaDisplayName(''); setMetaDescription(''); setMetaTag(TAG_AUTO_VALUE); return }
    setMetaDisplayName(scene.display_name?.trim() ?? '')
    setMetaDescription(scene.description?.trim() ?? '')
    setMetaTag(scene.tag?.trim() ? scene.tag.trim() : TAG_AUTO_VALUE)
  }, [scene?.id, scene?.display_name, scene?.description, scene?.tag])

  async function handleSaveMeta() {
    if (!scene || !cardId) return
    setMetaSaving(true)
    setMetaError(null)
    try {
      await putCardSceneMetadata(cardId, scene.id, {
        display_name: metaDisplayName.trim() ? metaDisplayName.trim() : null,
        description:  metaDescription.trim() ? metaDescription.trim() : null,
        tag:          metaTag === TAG_AUTO_VALUE ? null : metaTag.trim() || null,
      })
      onScenesChanged()
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : t('settings.errorMetaSave'))
    } finally {
      setMetaSaving(false)
    }
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cardId || !scene) return
    if (file.size > MAX_MB * 1024 * 1024) { setError(t('settings.errorTooLarge', { max: MAX_MB })); return }
    const previousId = scene.id
    setUploading(true)
    setError(null)
    try {
      const created = await executePresignedUpload(new CardSceneUploader(cardId), file)
      try {
        await deleteCardScene(cardId, previousId)
      } catch (delErr) {
        setError(delErr instanceof Error ? delErr.message : t('settings.errorDelete'))
        onScenesChanged()
        return
      }
      onSceneReplaced?.(created.id)
      onScenesChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleUploadNew(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !cardId) return
    if (file.size > MAX_MB * 1024 * 1024) { setError(t('settings.errorTooLarge', { max: MAX_MB })); return }
    setUploading(true)
    setError(null)
    try {
      await executePresignedUpload(new CardSceneUploader(cardId), file)
      onScenesChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!scene || !cardId) return
    setRemoving(true)
    setError(null)
    try {
      await deleteCardScene(cardId, scene.id)
      onScenesChanged()
      onSceneDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorDelete'))
    } finally {
      setRemoving(false)
    }
  }

  return {
    uploading, removing, error,
    tagPickOptions,
    metaDisplayName, setMetaDisplayName,
    metaDescription, setMetaDescription,
    metaTag, setMetaTag,
    metaSaving, metaError,
    handleSaveMeta, handleReplace, handleUploadNew, handleDelete,
  }
}
