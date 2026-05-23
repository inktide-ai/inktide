import { apiFetch, jsonOrThrow, emptyOrThrow } from './client'

// ── Response types ──

export interface ConnectorResponse {
  id: string
  slug: string
  name: string
  description: string
  category: string
  icon_url: string
  is_available: boolean
  sort_order: number
}

export interface InstallationResponse {
  id: string
  soul_id: string
  connector_id: string
  connector_slug: string
  connector_name: string
  installed_at: string
}

// ── API calls ──

export async function getConnectors(): Promise<ConnectorResponse[]> {
  const res = await apiFetch('/api/marketplace/connectors')
  return jsonOrThrow(res)
}

export async function getConnector(slug: string): Promise<ConnectorResponse> {
  const res = await apiFetch(`/api/marketplace/connectors/${slug}`)
  return jsonOrThrow(res)
}

export async function getSoulInstallations(soulId: string): Promise<InstallationResponse[]> {
  const res = await apiFetch(`/api/marketplace/souls/${soulId}/installs`)
  return jsonOrThrow(res)
}

export async function installConnector(
  soulId: string,
  connectorSlug: string,
): Promise<InstallationResponse> {
  const res = await apiFetch(`/api/marketplace/souls/${soulId}/installs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connector_slug: connectorSlug }),
  })
  return jsonOrThrow(res)
}

export async function uninstallConnector(installationId: string): Promise<void> {
  const res = await apiFetch(`/api/marketplace/installs/${installationId}`, {
    method: 'DELETE',
  })
  return emptyOrThrow(res)
}
