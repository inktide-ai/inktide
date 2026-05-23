import { apiFetch, jsonOrThrow } from './client'

export interface ProjectPlugin {
  plugin_id: string
  is_enabled: boolean
  config: Record<string, string>
}

export async function getProjectPlugins(projectId: string): Promise<ProjectPlugin[]> {
  const res = await apiFetch(`/api/projects/${projectId}/plugins`)
  return jsonOrThrow<ProjectPlugin[]>(res)
}

export async function upsertProjectPlugin(
  projectId: string,
  pluginId: string,
  body: { is_enabled: boolean; config?: Record<string, string> },
): Promise<ProjectPlugin> {
  const res = await apiFetch(`/api/projects/${projectId}/plugins/${pluginId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return jsonOrThrow<ProjectPlugin>(res)
}
