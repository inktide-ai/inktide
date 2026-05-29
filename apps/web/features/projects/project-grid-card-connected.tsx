'use client'
import { useTranslation } from 'react-i18next'
import { useProjectPreviewUrl } from '@/features/projects/hooks/useProjectPreviewUrl'
import { ProjectGridCard, type ProjectStatus } from './project-grid-card'
import type { ProjectListItem } from '@/features/projects/api/projects'

interface ProjectGridCardConnectedProps {
  project: ProjectListItem
  coverUrlFallback?: string | null
  onOpen?: () => void
  onExport?: () => void
}

export function ProjectGridCardConnected({ project, coverUrlFallback, onOpen, onExport }: ProjectGridCardConnectedProps) {
  const { t } = useTranslation('common')
  const previewUrl = useProjectPreviewUrl(project)

  function updatedLabel(dateStr: string): string {
    try {
      const diff = Date.now() - new Date(dateStr).getTime()
      const mins = Math.floor(diff / 60_000)
      if (mins < 60) return t('home.updatedM', { n: mins })
      const hrs = Math.floor(mins / 60)
      if (hrs < 24) return t('home.updatedH', { n: hrs })
      const days = Math.floor(hrs / 24)
      if (days < 7) return t('home.updatedD', { n: days })
      return t('home.updatedW', { n: Math.floor(days / 7) })
    } catch { return '' }
  }

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
