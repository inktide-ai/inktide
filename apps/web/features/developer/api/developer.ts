import { apiFetch, jsonOrThrow, emptyOrThrow } from '@/api/client'

export type OAuthScope = 'channelsRead' | 'channelsWrite' | 'messagesReceive' | 'soulRead'

export interface ApplicationDto {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  keycloakClientId: string
  redirectUris: string[]
  webhookUrl: string | null
  scopes: OAuthScope[]
  status: string
  connectorSlug: string | null
  createdAt: string
  // Only present on create / rotate-secret response
  clientSecret?: string
}

export interface WebhookDeliveryDto {
  id: string
  eventType: string
  statusCode: number | null
  attempt: number
  deliveredAt: string | null
  nextRetryAt: string | null
  createdAt: string
}

export interface AppInfoDto {
  appName: string
  iconUrl: string | null
  developerName: string
  requestedScopes: { scope: string; description: string }[]
}

export interface CreateApplicationRequest {
  name: string
  description?: string
  iconUrl?: string
  redirectUris: string[]
  webhookUrl?: string
  webhookSecret?: string
  scopes: OAuthScope[]
}

export interface UpdateApplicationRequest extends CreateApplicationRequest {}

export async function getMyApps(): Promise<ApplicationDto[]> {
  const res = await apiFetch('/api/developer/apps')
  return jsonOrThrow(res)
}

export async function getApp(id: string): Promise<ApplicationDto> {
  const res = await apiFetch(`/api/developer/apps/${id}`)
  return jsonOrThrow(res)
}

export async function createApp(req: CreateApplicationRequest): Promise<ApplicationDto> {
  const res = await apiFetch('/api/developer/apps', {
    method: 'POST',
    body: JSON.stringify(req),
  })
  return jsonOrThrow(res)
}

export async function updateApp(id: string, req: UpdateApplicationRequest): Promise<ApplicationDto> {
  const res = await apiFetch(`/api/developer/apps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })
  return jsonOrThrow(res)
}

export async function deleteApp(id: string): Promise<void> {
  const res = await apiFetch(`/api/developer/apps/${id}`, { method: 'DELETE' })
  return emptyOrThrow(res)
}

export async function rotateSecret(id: string): Promise<ApplicationDto> {
  const res = await apiFetch(`/api/developer/apps/${id}/rotate-secret`, { method: 'POST' })
  return jsonOrThrow(res)
}

export async function getDeliveries(appId: string, page = 1, pageSize = 20): Promise<WebhookDeliveryDto[]> {
  const res = await apiFetch(`/api/developer/apps/${appId}/deliveries?page=${page}&pageSize=${pageSize}`)
  return jsonOrThrow(res)
}

export async function testWebhook(appId: string): Promise<void> {
  const res = await apiFetch(`/api/developer/webhooks/test?appId=${appId}`, { method: 'POST' })
  return emptyOrThrow(res)
}

export async function getAppInfo(
  clientId: string,
  scope: string | null,
  redirectUri: string,
): Promise<AppInfoDto> {
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri })
  if (scope) params.set('scope', scope)
  const res = await fetch(`/api/oauth/app-info?${params}`)
  if (!res.ok) throw new Error(`app-info error: ${res.status}`)
  return res.json()
}
