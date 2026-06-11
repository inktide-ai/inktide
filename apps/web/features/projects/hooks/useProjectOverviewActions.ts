import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/lib/query/keys'
import { useClipboard } from '@/shared/hooks/useClipboard'
import { handleError } from '@/shared/lib/handle-error'
import type { ProjectActiveSoul } from '../api'

interface Options {
  projectId: string
  project: { name: string; description?: string | null } | null
  obsUrl: string | null
  updateProjectMeta: (data: { name: string; description?: string | null }) => Promise<void>
  toggleStatus: () => Promise<void>
  setEditing: (v: boolean) => void
}

export function useProjectOverviewActions({
  projectId,
  project,
  obsUrl,
  updateProjectMeta,
  toggleStatus,
  setEditing,
}: Options) {
  const qc = useQueryClient()
  const [saving, setSaving]     = useState(false)
  const [toggling, setToggling] = useState(false)
  const { copied, copy: copyObsUrl } = useClipboard()

  async function handleSave(name: string, description: string) {
    if (!project || saving) return
    setSaving(true)
    try {
      await updateProjectMeta({ name, description: description || null })
      setEditing(false)
    } catch (err) {
      handleError(err, 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePause() {
    if (!project || toggling) return
    setToggling(true)
    try {
      await toggleStatus()
    } catch (err) {
      handleError(err, 'Failed to toggle status')
    } finally {
      setToggling(false)
    }
  }

  function handleSoulChanged(_soul: ProjectActiveSoul | null) {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) })
  }

  function handleCopyObsUrl() {
    if (!obsUrl) return
    copyObsUrl(obsUrl)
  }

  return { saving, toggling, copied, handleSave, handleTogglePause, handleSoulChanged, handleCopyObsUrl }
}
