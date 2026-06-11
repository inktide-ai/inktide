export const HOME_ROUTE = '/home'
export const TEMPLATES_ROUTE = '/templates'
export const MARKETPLACE_ROUTE = '/marketplace'
export const DEVELOPER_ROUTE   = '/developer'

export function templatePath(id?: string): string {
  return id ? `${TEMPLATES_ROUTE}/${id}` : TEMPLATES_ROUTE
}
export const ROOT_ROUTE = '/'
export const REGISTER_ROUTE = '/register'
export const PRICING_ROUTE = '/pricing'
export const SOULS_ROUTE = '/souls'
export const PROJECTS_ROUTE = '/projects'
export const SANDBOX_ROUTE = '/edit/sandbox'

export function projectPath(id: string): string {
  return `${PROJECTS_ROUTE}/${id}`
}

export function soulPath(id: string): string {
  return `${SOULS_ROUTE}/${id}`
}

export function sandboxWithProject(projectId: string): string {
  return `${SANDBOX_ROUTE}?projectId=${projectId}`
}

export function checkoutPath(plan: string, period: string): string {
  return `/checkout?plan=${plan}${period}`
}
