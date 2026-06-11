import { apiFetch, jsonOrThrow } from '@/api/client'
import type { PagedResult } from '@/shared/types/paged-result'

// Feature-specific types (ImportProjectResponse, UpdateProjectRequest, etc.)
// stay in features/projects/api/projects.ts

export interface ProjectActiveSoul {
  id: string
  name: string
  avatar_url: string | null
}

export interface ProjectListItem {
  id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'archived'
  active_soul_id: string | null
  active_soul: ProjectActiveSoul | null
  active_model_id: string | null
  active_scene_id: string | null
  preview_url: string | null
  system_prompt: string | null
  updated_at: string
  sort_key: string
}

export interface Project extends ProjectListItem {
  user_id: string
  created_at: string
  personality: string
  personality_config: Record<string, unknown> | string | null
  response_behavior: Record<string, unknown> | string | null
  screen_awareness_settings: Record<string, unknown> | string | null
  auto_pilot: Record<string, unknown> | string | null
  memory_settings: Record<string, unknown> | string | null
}

export interface CreateProjectRequest {
  name: string
  description?: string
  active_soul_id?: string
}


export async function listProjects(soulId?: string): Promise<ProjectListItem[]> {
  const res = await apiFetch(soulId ? `/api/v1/projects?soulId=${soulId}` : '/api/v1/projects')
  const paged = await jsonOrThrow<PagedResult<ProjectListItem>>(res)
  return paged.items ?? []
}

export async function listProjectsPaged(params?: { soulId?: string; limit?: number; cursor?: string | null }): Promise<PagedResult<ProjectListItem>> {
  const qs = new URLSearchParams()
  if (params?.soulId) qs.set('soulId', params.soulId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  if (params?.cursor != null) qs.set('cursor', params.cursor)
  const url = qs.size > 0 ? `/api/v1/projects?${qs}` : '/api/v1/projects'
  const res = await apiFetch(url)
  return jsonOrThrow<PagedResult<ProjectListItem>>(res)
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const res = await apiFetch('/api/v1/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<Project>(res)
}

export async function getProject(id: string): Promise<Project> {
  const res = await apiFetch(`/api/v1/projects/${id}`)
  return jsonOrThrow<Project>(res)
}
