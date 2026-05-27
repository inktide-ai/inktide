'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProject, type Project } from '@/features/projects/api/projects'
import SoulCharacterHubPage from '@/features/character-editor/character-hub-page'

export default function ProjectDeployPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProject(id)
      .then(setProject)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-primary)]" />
      </div>
    )
  }

  const soulId = project?.active_soul_id

  if (!soulId) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-[14px] text-[var(--text-tertiary)] mx-6 mt-8">
        Bind a soul to this project first — go to Overview and use the Soul picker.
      </div>
    )
  }

  return <SoulCharacterHubPage soulId={soulId} />
}
