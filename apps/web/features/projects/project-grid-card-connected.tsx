'use client'
import { useProjectPreviewUrl } from '@/features/projects/hooks/useProjectPreviewUrl'
import { ProjectGridCard, type ProjectStatus } from './project-grid-card'
import type { ProjectListItem } from '@/features/projects/api/projects'

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

interface ProjectGridCardConnectedProps {
  project: ProjectListItem
  coverUrlFallback?: string | null
  onOpen?: () => void
  onExport?: () => void
}

export function ProjectGridCardConnected({ project, coverUrlFallback, onOpen, onExport }: ProjectGridCardConnectedProps) {
  const previewUrl = useProjectPreviewUrl(project)
  return (
    <ProjectGridCard
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
