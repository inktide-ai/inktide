import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'
import type { SceneRendererSettings } from '@/shared/hooks/useSceneRendererSettings'

// Re-export shared entity types and functions so app/ consumers don't need to change imports
export type {
  ProjectActiveSoul,
  ProjectListItem,
  Project,
  CreateProjectRequest,
} from '@/entities/project/api'
export { listProjects, createProject, getProject } from '@/entities/project/api'


export interface UpdateProjectRequest {
  name: string
  description?: string | null
  status?: string
  active_model_id?: string | null
  active_scene_id?: string | null
  system_prompt?: string | null
  personality?: string
  personality_config?: string
  response_behavior?: string
  screen_awareness_settings?: string
  auto_pilot?: string
  memory_settings?: string
}

export interface ImportProjectResponse {
  project_id: string
  soul_id: string | null
}


// Note: updateProject, deleteProject, bindSoul, unbindSoul are project-management
// operations used by app/ pages directly — kept here as feature-level API.

export async function updateProject(
  id: string,
  data: UpdateProjectRequest,
): Promise<import('@/entities/project/api').Project> {
  const res = await apiFetch(`/api/v1/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return jsonOrThrow(res)
}

export async function resetProjectSystemPrompt(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${id}/skills/system-prompt`, { method: 'DELETE' })
  return emptyOrThrow(res)
}

export async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${id}`, { method: 'DELETE' })
  return emptyOrThrow(res)
}

export async function bindSoul(
  projectId: string,
  soulId: string,
): Promise<import('@/entities/project/api').Project> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/soul`, {
    method: 'PUT',
    body: JSON.stringify({ soul_id: soulId }),
  })
  return jsonOrThrow(res)
}

export async function unbindSoul(
  projectId: string,
): Promise<import('@/entities/project/api').Project> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/soul`, { method: 'DELETE' })
  return jsonOrThrow(res)
}

export async function importProjectFile(data: object): Promise<ImportProjectResponse> {
  const res = await apiFetch('/api/v1/projects/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return jsonOrThrow<ImportProjectResponse>(res)
}


export async function exportProject(projectId: string): Promise<Blob> {
  const res = await apiFetch('/api/v1/projects/export', {
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
  const res = await apiFetch('/api/v1/projects/import/parse', { method: 'POST', body: formData })
  return jsonOrThrow<InktParseResponse>(res)
}

export interface FinalizeImportRequest {
  parse_token: string
  target_soul_id?: string
  import_connectors_disabled?: boolean
}

export async function finalizeImport(payload: FinalizeImportRequest): Promise<ImportProjectResponse> {
  const res = await apiFetch('/api/v1/projects/import/finalize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return jsonOrThrow<ImportProjectResponse>(res)
}


export interface ProjectSceneConfigDto {
  scene_config: SceneRendererSettings | null
  baseline_mood: string
}

export async function getProjectSceneConfig(projectId: string): Promise<ProjectSceneConfigDto | null> {
  const res = await fetch(`/api/public/projects/${encodeURIComponent(projectId)}/scene-config`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`scene-config fetch failed: ${res.status}`)
  return res.json() as Promise<ProjectSceneConfigDto>
}

export async function patchProjectSceneConfig(
  projectId: string,
  settings: SceneRendererSettings,
): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${encodeURIComponent(projectId)}/scene-config`, {
    method: 'PATCH',
    body: JSON.stringify({ scene_config: settings }),
  })
  return emptyOrThrow(res)
}

export async function reorderProject(
  projectId: string,
  body: { previous_id: string | null; next_id: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/position`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return emptyOrThrow(res)
}
