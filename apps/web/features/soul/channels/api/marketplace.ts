import { apiFetch, jsonOrThrow, emptyOrThrow } from '@/api/client'
import type { PagedResult } from '@/shared/types/paged-result'


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


export async function getConnectors(params?: { limit?: number; offset?: number }): Promise<PagedResult<ConnectorResponse>> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  const url = qs.size > 0 ? `/api/v1/marketplace/connectors?${qs}` : '/api/v1/marketplace/connectors'
  const res = await apiFetch(url)
  return jsonOrThrow(res)
}

export async function getConnector(slug: string): Promise<ConnectorResponse> {
  const res = await apiFetch(`/api/v1/marketplace/connectors/${slug}`)
  return jsonOrThrow(res)
}

export async function getSoulInstallations(soulId: string): Promise<InstallationResponse[]> {
  const res = await apiFetch(`/api/v1/marketplace/souls/${soulId}/installs`)
  return jsonOrThrow(res)
}

export async function installConnector(
  soulId: string,
  connectorSlug: string,
): Promise<InstallationResponse> {
  const res = await apiFetch(`/api/v1/marketplace/souls/${soulId}/installs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connectorSlug }),
  })
  return jsonOrThrow(res)
}

export async function uninstallConnector(installationId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/marketplace/installs/${installationId}`, {
    method: 'DELETE',
  })
  return emptyOrThrow(res)
}
