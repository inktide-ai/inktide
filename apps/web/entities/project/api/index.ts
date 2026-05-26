import { apiFetch, jsonOrThrow } from '@/api/client'

// ── Shared project entity types ────────────────────────────────────────────────
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
  system_prompt: string | null
  updated_at: string
  sort_key: string
}

export interface Project extends ProjectListItem {
  user_id: string
  created_at: string
}

export interface CreateProjectRequest {
  name: string
  description?: string
  active_soul_id?: string
}

// ── Shared project API functions ───────────────────────────────────────────────

export async function listProjects(soulId?: string): Promise<ProjectListItem[]> {
  const url = soulId ? `/api/projects?soulId=${soulId}` : '/api/projects'
  const res = await apiFetch(url)
  return jsonOrThrow<ProjectListItem[]>(res)
}

export async function createProject(data: CreateProjectRequest): Promise<Project> {
  const res = await apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<Project>(res)
}

export async function getProject(id: string): Promise<Project> {
  const res = await apiFetch(`/api/projects/${id}`)
  return jsonOrThrow<Project>(res)
}
