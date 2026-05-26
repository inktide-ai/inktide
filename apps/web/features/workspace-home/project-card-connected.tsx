'use client'
import type { ReactNode } from 'react'
import { useProjectPreviewUrl } from '@/hooks/useProjectPreviewUrl'
import { ProjectCard } from './project-card'
import type { ProjectListItem } from '@/api/projects'

interface ProjectCardConnectedProps {
  project: ProjectListItem
  editedLabel: string
  coverUrlFallback?: string
  icon: ReactNode
  onClick?: () => void
}

export function ProjectCardConnected({ project, editedLabel, coverUrlFallback, icon, onClick }: ProjectCardConnectedProps) {
  const previewUrl = useProjectPreviewUrl(project)
  return (
    <div
      role="button"
      tabIndex={0}
      className="flex-shrink-0 cursor-pointer text-left"
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick?.() }}
    >
      <ProjectCard
        title={project.name}
        editedLabel={editedLabel}
        coverUrl={coverUrlFallback}
        previewUrl={previewUrl}
        icon={icon}
      />
    </div>
  )
}
