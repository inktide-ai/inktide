'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProject, type Project } from '@/features/projects/api/projects'
import SoulCharacterHubPage from '@/screens/profile/SoulCharacterHubPage'

export default function SoulProjectCharacterPage() {
  const { projectId } = useParams<{ id: string; projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProject(projectId)
      .then(setProject)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

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
      <div className="mx-6 mt-8 flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-[var(--border-subtle)] text-[14px] text-[var(--text-tertiary)]">
        Bind a soul to this project first — go to Overview and use the Soul picker.
      </div>
    )
  }

  return <SoulCharacterHubPage soulId={soulId} />
}
