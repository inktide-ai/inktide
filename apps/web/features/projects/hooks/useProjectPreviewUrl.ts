'use client'
import type { ProjectListItem } from '@/entities/project/api'

export function useProjectPreviewUrl(project: ProjectListItem): string | null {
  return project.preview_url ?? null
}
