import { apiFetch, jsonOrThrow } from './client'

export interface AppearancePrefDto {
  theme: string
  accentColor: string
  fontSize: string
  compact: boolean
  reduceMotion: boolean
}

export interface NotifPrefDto {
  enabled: boolean
  emailMentions: boolean
  emailMessages: boolean
  emailProjectUpdates: boolean
  emailSystem: boolean
  pushMentions: boolean
  pushMessages: boolean
  pushReminders: boolean
}

export interface GlobalPreferencesDto {
  appearance: AppearancePrefDto
  language: string
  notifications: NotifPrefDto
  favorites: string[]
}

export interface WorkspacePreferencesDto {
  hubLayout: unknown | null
  sceneSettings: unknown | null
}

export async function getGlobalPreferences(): Promise<GlobalPreferencesDto> {
  const res = await apiFetch('/api/v1/me/preferences')
  return jsonOrThrow<GlobalPreferencesDto>(res)
}

export async function patchGlobalPreferences(patch: Partial<GlobalPreferencesDto>): Promise<GlobalPreferencesDto> {
  const res = await apiFetch('/api/v1/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  return jsonOrThrow<GlobalPreferencesDto>(res)
}

export async function getWorkspacePreferences(characterId: string): Promise<WorkspacePreferencesDto> {
  const res = await apiFetch(`/api/v1/me/preferences/workspace/${encodeURIComponent(characterId)}`)
  return jsonOrThrow<WorkspacePreferencesDto>(res)
}

export async function patchWorkspacePreferences(
  characterId: string,
  patch: Partial<WorkspacePreferencesDto>,
): Promise<WorkspacePreferencesDto> {
  const res = await apiFetch(
    `/api/v1/me/preferences/workspace/${encodeURIComponent(characterId)}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  )
  return jsonOrThrow<WorkspacePreferencesDto>(res)
}
