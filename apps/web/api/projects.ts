import { apiFetch, emptyOrThrow, jsonOrThrow } from './client'

// ── Types ──────────────────────────────────────────────────────────────────────

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

export interface UpdateProjectRequest {
  name: string
  description?: string | null
  status?: string
  active_model_id?: string | null
  active_scene_id?: string | null
  system_prompt?: string | null
}

export interface ImportProjectResponse {
  project_id: string
  soul_id: string | null
}

// ── API calls ──────────────────────────────────────────────────────────────────

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

export async function updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
  const res = await apiFetch(`/api/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<Project>(res)
}

export async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
  return emptyOrThrow(res)
}

export async function bindSoul(projectId: string, soulId: string): Promise<Project> {
  const res = await apiFetch(`/api/projects/${projectId}/soul`, {
    method: 'PUT',
    body: JSON.stringify({ soul_id: soulId }),
  })
  return jsonOrThrow<Project>(res)
}

export async function unbindSoul(projectId: string): Promise<Project> {
  const res = await apiFetch(`/api/projects/${projectId}/soul`, { method: 'DELETE' })
  return jsonOrThrow<Project>(res)
}

export async function importProjectFile(data: object): Promise<ImportProjectResponse> {
  const res = await apiFetch('/api/projects/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<ImportProjectResponse>(res)
}

// ── ZIP-based export / two-phase import ───────────────────────────────────────

export async function exportProject(projectId: string): Promise<Blob> {
  const res = await apiFetch('/api/projects/export', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId }),
  })
  if (!res.ok) throw new Error(`Export failed: ${res.status}`)
  return res.blob()
}

export interface InktParseResponse {
  parse_token: string
  project_name: string
  soul_name: string | null
  has_graph: boolean
  connector_count: number
  llm_model_id: string | null
  llm_provider: string | null
  tts_voice_id: string | null
  tts_provider: string | null
  warnings: string[]
}

export async function parseInktFile(file: File): Promise<InktParseResponse> {
  const formData = new FormData()
  formData.append('file', file)
  // Do NOT set Content-Type — browser sets multipart boundary automatically.
  const res = await apiFetch('/api/projects/import/parse', { method: 'POST', body: formData })
  return jsonOrThrow<InktParseResponse>(res)
}

export interface FinalizeImportRequest {
  parse_token: string
  target_soul_id?: string
  import_connectors_disabled?: boolean
}

export async function finalizeImport(payload: FinalizeImportRequest): Promise<ImportProjectResponse> {
  const res = await apiFetch('/api/projects/import/finalize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return jsonOrThrow<ImportProjectResponse>(res)
}

export async function reorderProject(
  projectId: string,
  body: { previous_id: string | null; next_id: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/projects/${projectId}/position`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return emptyOrThrow(res)
}
