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
export const ROOT_ROUTE = '/'
export const REGISTER_ROUTE = '/register'
export const PRICING_ROUTE = '/pricing'
export const SOULS_ROUTE = '/souls'
export const PROJECTS_ROUTE = '/projects'
export const SANDBOX_ROUTE = '/edit/sandbox'
export const GRAPH_ROUTE = '/edit/graph'

export const PROFILE_SETTINGS_BASE = '/edit/settings'

export function profileSettingsPath(segment: string): string {
  return `${PROFILE_SETTINGS_BASE}/${segment}`
}

export function projectPath(id: string): string {
  return `${PROJECTS_ROUTE}/${id}`
}

export function soulPath(id: string): string {
  return `${SOULS_ROUTE}/${id}`
}

export function sandboxWithProject(projectId: string): string {
  return `${SANDBOX_ROUTE}?projectId=${projectId}`
}

export function graphWithCharacter(characterId: string): string {
  return `${GRAPH_ROUTE}?characterId=${characterId}`
}

export function checkoutPath(plan: string, period: string): string {
  return `/checkout?plan=${plan}${period}`
}
