'use client'

import { useProjectPreviewUrl } from '@/hooks/useProjectPreviewUrl'
import { ProjectListRow } from './project-list-row'
import type { ProjectListItem } from '@/api/projects'
import type { ProjectStatus } from './project-grid-card'

function updatedLabel(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60_000)
    if (mins < 60) return `Updated ${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Updated ${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `Updated ${days}d ago`
    return `Updated ${Math.floor(days / 7)}w ago`
  } catch { return 'Updated recently' }
}

interface ProjectListRowConnectedProps {
  project: ProjectListItem
  coverUrlFallback?: string | null
  onOpen?: () => void
  onExport?: () => void
}

export function ProjectListRowConnected({ project, coverUrlFallback, onOpen, onExport }: ProjectListRowConnectedProps) {
  const previewUrl = useProjectPreviewUrl(project)
  return (
    <ProjectListRow
      characterId={project.id}
      title={project.name}
      description={project.description ?? undefined}
      status={(project.status as ProjectStatus) ?? 'active'}
      coverUrl={coverUrlFallback ?? project.active_soul?.avatar_url ?? undefined}
      previewUrl={previewUrl}
      platforms={[]}
      updatedLabel={updatedLabel(project.updated_at)}
      activeSoul={project.active_soul ?? undefined}
      onOpen={onOpen}
      onExport={onExport}
    />
  )
}
