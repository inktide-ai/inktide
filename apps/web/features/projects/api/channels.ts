import { apiFetch, emptyOrThrow, jsonOrThrow } from '@/api/client'

export interface ProjectChannelResponse {
  id: string
  project_id: string
  platform: string
  channel_name: string
  channel_id: string | null
  bot_username: string
  is_active: boolean
  connected_at: string | null
  created_at: string
}

export async function listProjectChannels(projectId: string): Promise<ProjectChannelResponse[]> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/channels`)
  return jsonOrThrow<ProjectChannelResponse[]>(res)
}

export async function createProjectChannel(
  projectId: string,
  body: { platform: string; channel_name: string },
): Promise<ProjectChannelResponse> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/channels`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<ProjectChannelResponse>(res)
}

export async function patchProjectChannel(
  projectId: string,
  channelId: string,
  body: { is_active?: boolean },
): Promise<ProjectChannelResponse> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/channels/${channelId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return jsonOrThrow<ProjectChannelResponse>(res)
}

export async function deleteProjectChannel(projectId: string, channelId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/projects/${projectId}/channels/${channelId}`, { method: 'DELETE' })
  await emptyOrThrow(res)
}
