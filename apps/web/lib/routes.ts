/** Maps internal tab ids (CharacterEditPage `returnTab`, IdentityCard) → URL segment under `/settings`. */
export const TAB_TO_ROUTE: Record<string, string> = {
  profile: 'identity',
  skills: 'skills',
  avatars: 'model',
  scene: 'scene',
  memory: 'memory',
  brain: 'brain',
  voice: 'voice',
  connection: 'channels',
  obs: 'obs',
  backup: 'backup',
}

export const HOME_ROUTE = '/home'
export const GRAPH_ROUTE = '/edit/graph'

export const PROFILE_SETTINGS_BASE = '/edit/settings'

export function profileSettingsPath(segment: string): string {
  return `${PROFILE_SETTINGS_BASE}/${segment}`
}
