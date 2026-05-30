import { apiFetch, jsonOrThrow, emptyOrThrow } from '@/api/client'

// ── Response types ──

export interface ConnectorResponse {
  id: string
  slug: string
  name: string
  description: string
  category: string
  iconUrl: string
  isAvailable: boolean
  sortOrder: number
  // enriched fields (added in migration AddConnectorMetadata)
  shortDescription?: string
  authType?: string
  isNative?: boolean
  websiteUrl?: string | null
  authorName?: string
  // Platform Layer: linked Developer application
  applicationId?: string | null
}

export interface InstallationResponse {
  id: string
  soulId: string
  connectorId: string
  connectorSlug: string
  connectorName: string
  installedAt: string
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
    body: JSON.stringify({ connectorSlug }),
  })
  return jsonOrThrow(res)
}

export async function uninstallConnector(installationId: string): Promise<void> {
  const res = await apiFetch(`/api/marketplace/installs/${installationId}`, {
    method: 'DELETE',
  })
  return emptyOrThrow(res)
}
