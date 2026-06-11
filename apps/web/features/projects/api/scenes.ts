import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'

export interface ProjectSceneResponse {
  id: string
  project_id: string
  storage_key: string
  public_url: string | null
  original_name: string
  content_type: string
  size_bytes: number | null
  display_name: string | null
  description: string | null
  sort_key: string | null
  created_at: string
  is_active: boolean
}

export async function listProjectScenes(projectId: string): Promise<ProjectSceneResponse[]> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/scenes`)
  return jsonOrThrow<ProjectSceneResponse[]>(res)
}

export async function presignProjectScene(
  projectId: string,
  body: { file_name: string; content_type: string; size_bytes: number },
): Promise<{ upload_url: string; storage_key: string; expires_at: string; required_content_type: string }> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/scenes/presign`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow(res)
}

export async function completeProjectSceneUpload(
  projectId: string,
  body: { storage_key: string; file_name: string; content_type: string; size_bytes: number; display_name?: string | null },
): Promise<ProjectSceneResponse> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/scenes/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<ProjectSceneResponse>(res)
}

export async function patchProjectScene(
  projectId: string,
  sceneId: string,
  body: { active?: boolean },
): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/scenes/${sceneId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  await emptyOrThrow(res)
}

export async function reorderProjectScene(
  projectId: string,
  sceneId: string,
  body: { previous_id: string | null; next_id: string | null },
): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/scenes/${sceneId}/position`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  await emptyOrThrow(res)
}

export async function deleteProjectScene(projectId: string, sceneId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/scenes/${sceneId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}
