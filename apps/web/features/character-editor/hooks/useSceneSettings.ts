'use client'
import { type RefObject, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectSceneResponse } from '@/features/projects/api/scenes'
import { deleteProjectScene } from '@/features/projects/api/scenes'
import { CardSceneUploader } from '@/entities/soul/services/upload/CardSceneUploader'
import { executePresignedUpload } from '@/shared/services/upload/PresignedUploadService'
import { BUILTIN_SCENE_TAGS, mergeSceneTagPickOptions } from '../tabs/scene-tag-utils'

const MAX_DISPLAY = 200
const MAX_DESC = 2000
const ALLOWED_TYPES = 'image/jpeg,image/png,image/webp'
const MAX_MB = 50

export { MAX_DISPLAY, MAX_DESC, ALLOWED_TYPES }

export interface UseSceneSettingsResult {
  uploading:          boolean
  removing:           boolean
  error:              string | null
  tagPickOptions:     string[]
  metaDisplayName:    string
  setMetaDisplayName: (v: string) => void
  metaDescription:    string
  setMetaDescription: (v: string) => void
  metaSaving:         boolean
  metaError:          string | null
  handleSaveMeta:     () => Promise<void>
  handleReplace:      (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleUploadNew:    (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleDelete:       () => Promise<void>
}

interface UseSceneSettingsParams {
  scene:            ProjectSceneResponse | null
  projectId:        string | undefined
  fileInputRef:     RefObject<HTMLInputElement | null>
  onScenesChanged:  () => void
  onSceneReplaced?: (newSceneId: string) => void
  onSceneDeleted:   () => void
}

export function useSceneSettings({
  scene, projectId, fileInputRef,
  onScenesChanged, onSceneReplaced, onSceneDeleted,
}: UseSceneSettingsParams): UseSceneSettingsResult {
  const { t } = useTranslation('scene')

  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const tagPickOptions = mergeSceneTagPickOptions([...BUILTIN_SCENE_TAGS])

  const [metaDisplayName, setMetaDisplayName] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [metaSaving]                          = useState(false)
  const [metaError]                           = useState<string | null>(null)

  useEffect(() => {
    if (!scene) { setMetaDisplayName(''); setMetaDescription(''); return }
    setMetaDisplayName(scene.display_name?.trim() ?? '')
    setMetaDescription(scene.description?.trim() ?? '')
  }, [scene?.id, scene?.display_name, scene?.description])

  async function handleSaveMeta() {
    // Metadata updates not supported by project scenes API
  }

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !projectId || !scene) return
    if (file.size > MAX_MB * 1024 * 1024) { setError(t('settings.errorTooLarge', { max: MAX_MB })); return }
    const previousId = scene.id
    setUploading(true)
    setError(null)
    try {
      const created = await executePresignedUpload(new CardSceneUploader(projectId), file)
      try {
        await deleteProjectScene(projectId, previousId)
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
    if (!file || !projectId) return
    if (file.size > MAX_MB * 1024 * 1024) { setError(t('settings.errorTooLarge', { max: MAX_MB })); return }
    setUploading(true)
    setError(null)
    try {
      await executePresignedUpload(new CardSceneUploader(projectId), file)
      onScenesChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.errorUpload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDelete() {
    if (!scene || !projectId) return
    setRemoving(true)
    setError(null)
    try {
      await deleteProjectScene(projectId, scene.id)
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
    metaSaving, metaError,
    handleSaveMeta, handleReplace, handleUploadNew, handleDelete,
  }
}
